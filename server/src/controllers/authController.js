const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    return ApiResponse.success(res, result, 'Registration successful', 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return ApiResponse.success(res, result, 'Login successful', 200);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token');
  return ApiResponse.success(res, null, 'Logged out successfully');
};

const getMe = async (req, res) => {
  const user = authService.sanitizeUser(req.user);
  return ApiResponse.success(res, { user }, 'User profile retrieved');
};

const loginAdmin = async (req, res, next) => {
  try {
    const result = await authService.loginAdminUser({
      email: req.body.email,
      password: req.body.password,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });
    return ApiResponse.success(res, result, 'Admin login successful', 200);
  } catch (error) {
    next(error);
  }
};

const getAdminMe = async (req, res) => {
  const user = authService.sanitizeUser(req.user);
  return ApiResponse.success(res, { user }, 'Admin session verified');
};

const createStaff = async (req, res, next) => {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.createStaffAccount({ email, password, name, role });
    return ApiResponse.success(res, result, 'Staff account created successfully', 201);
  } catch (error) {
    next(error);
  }
};

const getStaff = async (req, res, next) => {
  try {
    const result = await authService.getStaffAccounts();
    return ApiResponse.success(res, result, 'Staff accounts retrieved', 200);
  } catch (error) {
    next(error);
  }
};

const deleteStaff = async (req, res, next) => {
  try {
    const result = await authService.deleteStaffAccount(req.params.id);
    return ApiResponse.success(res, result, 'Staff account deleted', 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  loginAdmin,
  logout,
  getMe,
  getAdminMe,
  createStaff,
  getStaff,
  deleteStaff
};
