const crypto = require('crypto');
const Razorpay = require('razorpay');
const env = require('../config/env');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const { REGISTRATION_STATUS, PAYMENT_STATUS, PAYMENT_PROVIDERS } = require('../constants');

// Initialize Razorpay SDK instance safely
let razorpayInstance = null;
if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET) {
  try {
    razorpayInstance = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.error('Razorpay initialization error:', err.message);
  }
}

const createOrder = async (registrationId, userId) => {
  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) {
    const error = new Error('Registration record not found');
    error.statusCode = 404;
    error.errorCode = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  if (registration.userId.toString() !== userId.toString()) {
    const error = new Error('Unauthorized registration payment request');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN';
    throw error;
  }

  const event = registration.eventId;
  if (!event || !event.isPaid) {
    const error = new Error('This event is free or invalid for payment');
    error.statusCode = 400;
    error.errorCode = 'FREE_EVENT';
    throw error;
  }

  // Server dictates exact price (in smallest currency unit, e.g. Paise for INR)
  const amountInPaise = Math.round((event.price + (event.platformFee || 0)) * 100);

  let orderId = `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  let razorpayOrder = null;

  if (razorpayInstance && !env.RAZORPAY_KEY_ID.includes('placeholder')) {
    try {
      razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: event.currency || 'INR',
        receipt: registration.registrationId,
        notes: {
          eventId: event._id.toString(),
          registrationId: registration._id.toString()
        }
      });
      orderId = razorpayOrder.id;
    } catch (err) {
      console.error('Razorpay Order Creation Failed, fallback to mock order:', err.message);
    }
  }

  // Save or update Payment document
  let payment = await Payment.findOne({ registrationId: registration._id });
  if (!payment) {
    payment = await Payment.create({
      orderId,
      registrationId: registration._id,
      eventId: event._id,
      userId,
      provider: PAYMENT_PROVIDERS.RAZORPAY,
      amount: event.price + (event.platformFee || 0),
      currency: event.currency || 'INR',
      status: PAYMENT_STATUS.PENDING
    });
  } else {
    payment.orderId = orderId;
    payment.status = PAYMENT_STATUS.PENDING;
    await payment.save();
  }

  registration.paymentId = payment._id;
  registration.status = REGISTRATION_STATUS.PAYMENT_PENDING;
  await registration.save();

  return {
    orderId,
    amount: event.price + (event.platformFee || 0),
    amountInPaise,
    currency: event.currency || 'INR',
    keyId: env.RAZORPAY_KEY_ID,
    registrationId: registration.registrationId,
    eventTitle: event.title
  };
};

const verifyPayment = async ({ razorpayOrderId, razorpayPaymentId, razorpaySignature, registrationId }, userId) => {
  const registration = await Registration.findById(registrationId).populate('eventId');
  if (!registration) {
    const error = new Error('Registration not found');
    error.statusCode = 404;
    error.errorCode = 'REGISTRATION_NOT_FOUND';
    throw error;
  }

  const payment = await Payment.findOne({ registrationId: registration._id });
  if (!payment) {
    const error = new Error('Payment record not found');
    error.statusCode = 404;
    error.errorCode = 'PAYMENT_NOT_FOUND';
    throw error;
  }

  // Validate Razorpay Signature if in non-mock environment
  let isSignatureValid = true;
  if (env.RAZORPAY_KEY_SECRET && !env.RAZORPAY_KEY_SECRET.includes('placeholder')) {
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    isSignatureValid = generatedSignature === razorpaySignature;
  }

  if (!isSignatureValid) {
    payment.status = PAYMENT_STATUS.FAILED;
    await payment.save();
    registration.status = REGISTRATION_STATUS.PAYMENT_FAILED;
    await registration.save();

    const error = new Error('Payment signature verification failed');
    error.statusCode = 400;
    error.errorCode = 'INVALID_PAYMENT_SIGNATURE';
    throw error;
  }

  // Payment Verified Success!
  payment.status = PAYMENT_STATUS.SUCCESS;
  payment.transactionId = razorpayPaymentId || `txn_mock_${Date.now()}`;
  payment.signature = razorpaySignature || 'mock_signature';
  await payment.save();

  registration.status = REGISTRATION_STATUS.CONFIRMED;
  await registration.save();

  await AuditLog.create({
    actorId: userId,
    action: 'PAYMENT_VERIFIED',
    resource: 'PAYMENT',
    resourceId: payment._id.toString(),
    metadata: { amount: payment.amount, registrationId: registration.registrationId }
  });

  try {
    const { sendRegistrationEmail } = require('./emailService');
    await sendRegistrationEmail(registration, registration.eventId);
  } catch (err) {
    console.error('Failed to send registration email:', err);
  }

  return {
    registration,
    payment
  };
};

const handleWebhook = async (rawBody, signature) => {
  // Webhook verification & idempotent event handler
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(rawBody))
    .digest('hex');

  if (expectedSignature !== signature) {
    const error = new Error('Invalid webhook signature');
    error.statusCode = 400;
    throw error;
  }

  const { event, payload } = rawBody;
  if (event === 'payment.captured' && payload && payload.payment) {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;

    const payment = await Payment.findOne({ orderId });
    if (payment && payment.status !== PAYMENT_STATUS.SUCCESS) {
      payment.status = PAYMENT_STATUS.SUCCESS;
      payment.transactionId = paymentEntity.id;
      payment.rawWebhookPayload = rawBody;
      await payment.save();

      await Registration.findByIdAndUpdate(payment.registrationId, {
        status: REGISTRATION_STATUS.CONFIRMED
      });
    }
  }

  return { success: true };
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook
};
