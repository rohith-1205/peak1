const adminService = require('../services/adminService');
const ApiResponse = require('../utils/apiResponse');

const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    return ApiResponse.success(res, stats, 'Dashboard analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const result = await adminService.getAuditLogs(req.query);
    return ApiResponse.success(res, result, 'Audit logs retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAuditLogs
};
