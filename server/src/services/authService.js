const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { ROLES } = require('../constants');

// Generates a standard JWT for participant users
const generateToken = (userId, role) => {
  return jwt.sign({ id: userId, role, scope: 'user' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
};

// Generates an admin-scoped JWT for administrative operations
const generateAdminToken = (userId, role) => {
  return jwt.sign({ id: userId, role, scope: 'admin' }, env.JWT_SECRET, {
    expiresIn: env.ADMIN_JWT_EXPIRES_IN
  });
};

// Registers a standard participant user
const registerUser = async ({ name, email, password, phone, role }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    error.errorCode = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  // Prevent creating admin accounts via public registration
  const userRole = (role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN) ? ROLES.USER : (role || ROLES.USER);

  const user = await User.create({
    name,
    email,
    password,
    phone,
    role: userRole
  });

  const token = generateToken(user._id, user.role);
  return { user: sanitizeUser(user), token };
};

// Authenticates standard participants on public login endpoint
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Block admin accounts from public login unless explicitly allowed via env
  if ((user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN) && env.ALLOW_ADMIN_PUBLIC_LOGIN !== 'true') {
    const error = new Error('Admin accounts must log in via the Admin Console (/admin/login)');
    error.statusCode = 403;
    error.errorCode = 'ADMIN_LOGIN_REQUIRED';
    throw error;
  }

  const token = generateToken(user._id, user.role);
  return { user: sanitizeUser(user), token };
};

// Authenticates administrator accounts on /admin/login endpoint with audit logging
const loginAdminUser = async ({ email, password, ipAddress }) => {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  // Validate existence, password match, and admin role
  const isUserValid = !!user;
  const isMatch = isUserValid ? await user.comparePassword(password) : false;
  const isAdminRole = isUserValid && (user.role === ROLES.ADMIN || user.role === ROLES.SUPER_ADMIN || user.role === ROLES.CHECKIN_STAFF);

  if (!isUserValid || !isMatch || !isAdminRole) {
    // Audit log failed attempt without leaking account status
    await AuditLog.create({
      actorId: user ? user._id : null,
      action: 'ADMIN_LOGIN_FAILURE',
      resource: 'AUTH',
      ipAddress: ipAddress || '0.0.0.0',
      metadata: { email: email.toLowerCase(), reason: !isAdminRole && isMatch ? 'NON_ADMIN_ROLE' : 'INVALID_CREDENTIALS' }
    });

    const error = new Error('Invalid credentials');
    error.statusCode = 401;
    error.errorCode = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Log successful admin authentication
  await AuditLog.create({
    actorId: user._id,
    action: 'ADMIN_LOGIN_SUCCESS',
    resource: 'AUTH',
    resourceId: user._id.toString(),
    ipAddress: ipAddress || '0.0.0.0',
    metadata: { email: user.email }
  });

  const token = generateAdminToken(user._id, user.role);
  return { user: sanitizeUser(user), token };
};

// Removes sensitive fields from user object before returning to client
const sanitizeUser = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
};

// Creates a staff account (restricted to admin calls)
const createStaffAccount = async ({ email, password, name, role }) => {
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.statusCode = 400;
    error.errorCode = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const assignedRole = (role === ROLES.ADMIN || role === ROLES.CHECKIN_STAFF) ? role : ROLES.CHECKIN_STAFF;
  
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: assignedRole
  });

  return sanitizeUser(user);
};

const getStaffAccounts = async () => {
  const staff = await User.find({
    role: { $in: [ROLES.ADMIN, ROLES.CHECKIN_STAFF] }
  }).select('-password').sort({ createdAt: -1 });
  return staff;
};

const deleteStaffAccount = async (id) => {
  const user = await User.findById(id);
  if (!user) {
    const error = new Error('Staff account not found');
    error.statusCode = 404;
    throw error;
  }
  if (user.role === ROLES.SUPER_ADMIN) {
    const error = new Error('Cannot delete Super Admin account');
    error.statusCode = 403;
    throw error;
  }
  await User.findByIdAndDelete(id);
  return { success: true };
};

const crypto = require('crypto');
const { sendPasswordResetEmail } = require('./emailService');

const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    // Return friendly success to prevent account enumeration
    return { message: 'If an account with that email exists, a password reset email has been sent.' };
  }

  // Generate random 32-byte hex token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Set token & 1-hour expiration
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  // Build Reset Link
  const resetUrl = `${env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${rawToken}`;

  // Send Email (async in background)
  sendPasswordResetEmail(user, resetUrl).catch(err => console.error('Reset email error:', err.message));

  return { message: 'If an account with that email exists, a password reset email has been sent.' };
};

const resetPassword = async (rawToken, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) {
    const error = new Error('Password reset token is invalid or has expired.');
    error.statusCode = 400;
    error.errorCode = 'INVALID_RESET_TOKEN';
    throw error;
  }

  // Update password & clear reset token
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password has been reset successfully. You can now log in with your new password.' };
};

module.exports = {
  generateToken,
  generateAdminToken,
  registerUser,
  loginUser,
  loginAdminUser,
  sanitizeUser,
  createStaffAccount,
  getStaffAccounts,
  deleteStaffAccount,
  requestPasswordReset,
  resetPassword
};
