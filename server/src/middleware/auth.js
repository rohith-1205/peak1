const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const env = require('../config/env');
const User = require('../models/User');
const ApiResponse = require('../utils/apiResponse');
const { ROLES } = require('../constants');

// Authenticates JWT bearer token and attaches user & tokenPayload to request
const authenticateUser = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return ApiResponse.error(res, 'Authentication token missing. Please log in.', 401, 'UNAUTHORIZED');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return ApiResponse.error(res, 'User associated with token no longer exists.', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return ApiResponse.error(res, 'Session expired. Please log in again.', 401, 'TOKEN_EXPIRED');
    }
    return ApiResponse.error(res, 'Invalid authentication token.', 401, 'INVALID_TOKEN');
  }
};

// Enforces administrator role AND explicit 'admin' scope claim in token
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required.', 401, 'UNAUTHORIZED');
  }

  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
    return ApiResponse.error(res, 'Access denied. Administrator privileges required.', 403, 'FORBIDDEN');
  }

  // Enforce admin scope token
  if (!req.tokenPayload || req.tokenPayload.scope !== 'admin') {
    return ApiResponse.error(res, 'Access denied. Administrator session scope required.', 403, 'INVALID_ADMIN_SCOPE');
  }

  next();
};

const requireGateStaff = (req, res, next) => {
  if (!req.user) {
    return ApiResponse.error(res, 'Authentication required.', 401, 'UNAUTHORIZED');
  }

  if (req.user.role !== ROLES.ADMIN && req.user.role !== ROLES.SUPER_ADMIN && req.user.role !== ROLES.CHECKIN_STAFF) {
    return ApiResponse.error(res, 'Access denied. Gate Staff privileges required.', 403, 'FORBIDDEN');
  }

  // Enforce admin scope token
  if (!req.tokenPayload || req.tokenPayload.scope !== 'admin') {
    return ApiResponse.error(res, 'Access denied. Staff session scope required.', 403, 'INVALID_ADMIN_SCOPE');
  }

  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      req.tokenPayload = decoded;
    }
  } catch (error) {
    // Ignore invalid token in optional auth
  }
  next();
};

// Strict rate limiter for admin login attempts (5 attempts per 15 minutes per IP)
const adminLoginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many admin login attempts from this IP. Please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

// Gate check-in rate limiter (120 requests / min per IP)
const gateRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Gate check-in rate limit exceeded (max 120 scans/min per admin). Please wait a moment.',
    errorCode: 'GATE_RATE_LIMIT_EXCEEDED'
  }
});

module.exports = {
  authenticateUser,
  requireAdmin,
  requireGateStaff,
  optionalAuth,
  adminLoginRateLimiter,
  gateRateLimiter
};

