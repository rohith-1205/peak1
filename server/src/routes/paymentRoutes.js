const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateUser } = require('../middleware/auth');

router.post('/create-order', authenticateUser, paymentController.createOrder);
router.post('/verify', authenticateUser, paymentController.verifyPayment);
router.post('/webhook', express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), paymentController.handleWebhook);

module.exports = router;
