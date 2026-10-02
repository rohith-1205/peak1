const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

router.get('/stats', authenticateUser, requireAdmin, adminController.getDashboardStats);
router.get('/audit-logs', authenticateUser, requireAdmin, adminController.getAuditLogs);

module.exports = router;
