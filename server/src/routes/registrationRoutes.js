const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticateUser, requireAdmin, requireGateStaff, gateRateLimiter } = require('../middleware/auth');
const { validate, registrationSchema } = require('../validators');

router.post('/event/:eventId', authenticateUser, validate(registrationSchema), registrationController.registerForEvent);
router.get('/my', authenticateUser, registrationController.getMyRegistrations);
router.get('/detail/:id', authenticateUser, registrationController.getRegistrationById);

// Admin Routes
router.get('/admin/list', authenticateUser, requireAdmin, registrationController.listRegistrations);
router.post('/admin/check-in', authenticateUser, requireGateStaff, gateRateLimiter, registrationController.checkIn);
router.post('/admin/check-in/undo', authenticateUser, requireGateStaff, gateRateLimiter, registrationController.undoCheckIn);
router.get('/admin/check-in/stats', authenticateUser, requireGateStaff, registrationController.getCheckInStats);
router.get('/admin/check-in/logs', authenticateUser, requireGateStaff, registrationController.getCheckInLogs);
router.get('/admin/export', authenticateUser, requireAdmin, registrationController.exportRegistrationsPDF);
router.get('/admin/export/csv', authenticateUser, requireAdmin, registrationController.exportRegistrationsCSV);
router.delete('/admin/:id', authenticateUser, requireAdmin, registrationController.deleteRegistration);
router.put('/admin/:id/leaderboard', authenticateUser, requireAdmin, registrationController.updateLeaderboard);
router.post('/admin/event/:eventId/manual-register', authenticateUser, requireAdmin, registrationController.manualRegister);

module.exports = router;


