const paymentService = require('../services/paymentService');
const ApiResponse = require('../utils/apiResponse');

const createOrder = async (req, res, next) => {
  try {
    const { registrationId } = req.body;
    const order = await paymentService.createOrder(registrationId, req.user._id);
    return ApiResponse.success(res, order, 'Payment order created successfully');
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const result = await paymentService.verifyPayment(req.body, req.user._id);
    return ApiResponse.success(res, result, 'Payment verified and registration confirmed!');
  } catch (error) {
    next(error);
  }
};

const handleWebhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const result = await paymentService.handleWebhook(req.body, signature);
    return ApiResponse.success(res, result, 'Webhook processed');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook
};
