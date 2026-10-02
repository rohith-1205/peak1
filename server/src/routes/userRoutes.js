/**
 * User Routes
 * Defines participant user profile management routes.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateUser } = require('../middleware/auth');
const { validate, updateProfileSchema } = require('../validators');

router.get('/me/profile', authenticateUser, userController.getProfile);
router.put('/me/profile', authenticateUser, validate(updateProfileSchema), userController.updateProfile);

module.exports = router;
