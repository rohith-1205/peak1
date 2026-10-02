/**
 * Upload Routes
 * Express routes for image uploads, protected by admin authorization middleware.
 */

const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { authenticateUser, requireAdmin } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

router.post(
  '/event-image',
  authenticateUser,
  requireAdmin,
  upload.single('image'),
  uploadController.uploadEventImage
);

module.exports = router;
