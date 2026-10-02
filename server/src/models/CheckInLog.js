const mongoose = require('mongoose');

const checkInLogSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      index: true
    },
    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Registration',
      default: null
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true
    },
    scannedCode: {
      type: String
    },
    result: {
      type: String,
      enum: [
        'GRANTED',
        'ALREADY_CHECKED_IN',
        'DENIED',
        'INVALID_QR',
        'INVALID_SIGNATURE',
        'WRONG_EVENT',
        'PASS_NOT_FOUND',
        'PAYMENT_PENDING',
        'REGISTRATION_CANCELLED',
        'UNDO'
      ],
      required: true,
      index: true
    },
    reason: {
      type: String
    },
    method: {
      type: String,
      enum: ['QR', 'MANUAL'],
      default: 'QR'
    },
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

checkInLogSchema.index({ eventId: 1, createdAt: -1 });
checkInLogSchema.index({ registrationId: 1, createdAt: -1 });

module.exports = mongoose.model('CheckInLog', checkInLogSchema);
