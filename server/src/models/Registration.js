const mongoose = require('mongoose');
const { REGISTRATION_STATUS } = require('../constants');

const registrationSchema = new mongoose.Schema(
  {
    registrationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    participantDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, lowercase: true, trim: true },
      phone: { type: String, required: true },
      dob: { type: Date },
      gender: { type: String },
      city: { type: String },
      emergencyContact: { type: String },
      bloodGroup: { type: String },
      tShirtSize: { type: String }
    },
    participantSnapshot: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
      dob: { type: Date },
      gender: { type: String },
      city: { type: String },
      state: { type: String },
      emergencyContactName: { type: String },
      emergencyContactPhone: { type: String },
      bloodGroup: { type: String },
      tShirtSize: { type: String },
      snapshotAt: { type: Date, default: Date.now }
    },
    customResponses: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    },
    raceDetails: {
      vehicleModel: { type: String },
      vehicleNumber: { type: String },
      drivingLicense: { type: String },
      teamName: { type: String },
      categoryClass: { type: String }
    },
    status: {
      type: String,
      enum: Object.values(REGISTRATION_STATUS),
      default: REGISTRATION_STATUS.PENDING,
      index: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    qrCodeData: {
      type: String
    },
    checkInDetails: {
      isCheckedIn: { type: Boolean, default: false },
      checkInTime: { type: Date },
      checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    leaderboardScore: { type: Number, default: 0 },
    leaderboardRank: { type: Number, default: null }
  },
  {
    timestamps: true
  }
);

// Indexes for fast lookup & unique participant registration per event
registrationSchema.index({ eventId: 1, userId: 1 }, { unique: true });
registrationSchema.index({ eventId: 1, 'participantDetails.email': 1 });
registrationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Registration', registrationSchema);
