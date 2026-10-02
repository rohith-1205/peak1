/**
 * User Service
 * Manages user profile data persistence and profile completeness verification.
 */

const User = require('../models/User');

const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }
  return sanitizeUserProfile(user);
};

const updateUserProfile = async (userId, profileData) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    error.errorCode = 'USER_NOT_FOUND';
    throw error;
  }

  // Update account level phone if passed
  if (profileData.phone) {
    user.phone = profileData.phone;
  }

  // Merge profile subdocument
  user.profile = {
    ...user.profile,
    ...profileData,
    profileCompletedAt: new Date()
  };

  await user.save();
  return sanitizeUserProfile(user);
};

const sanitizeUserProfile = (user) => {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;

  // Calculate profile completion percentage
  const profile = obj.profile || {};
  const fields = [
    'dob', 'gender', 'city', 'state',
    'emergencyContactName', 'emergencyContactPhone',
    'bloodGroup', 'tShirtSize'
  ];
  let filledCount = 0;
  fields.forEach((f) => {
    if (profile[f]) filledCount++;
  });
  if (obj.phone) filledCount++;

  const totalFields = fields.length + 1;
  const completionPercentage = Math.round((filledCount / totalFields) * 100);

  return {
    ...obj,
    completionPercentage
  };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  sanitizeUserProfile
};
