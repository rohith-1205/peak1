const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateUser, requireAdmin, requireGateStaff, adminLoginRateLimiter } = require('../middleware/auth');
const { validate, registerSchema, loginSchema, adminLoginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../validators');

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticateUser, authController.getMe);

// Dedicated Admin Authentication Routes
router.post('/admin/login', adminLoginRateLimiter, validate(adminLoginSchema), authController.loginAdmin);
router.get('/admin/me', authenticateUser, requireGateStaff, authController.getAdminMe);

router.post('/admin/staff', authenticateUser, requireAdmin, authController.createStaff);
router.get('/admin/staff', authenticateUser, requireAdmin, authController.getStaff);
router.delete('/admin/staff/:id', authenticateUser, requireAdmin, authController.deleteStaff);

module.exports = router;
