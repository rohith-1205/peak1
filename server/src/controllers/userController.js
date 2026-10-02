/**
 * User Controller
 * REST handlers for user profile management endpoints.
 */

const userService = require('../services/userService');
const ApiResponse = require('../utils/apiResponse');

const getProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user._id);
    return ApiResponse.success(res, { user }, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateUserProfile(req.user._id, req.body);
    return ApiResponse.success(res, { user }, 'User profile updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile
};
