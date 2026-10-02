const mongoose = require('mongoose');
const { EVENT_STATUS, EVENT_CATEGORIES } = require('../constants');

const customFieldSchema = new mongoose.Schema({
  id: { type: String },
  fieldId: { type: String },
  label: { type: String, required: true },
  type: { 
    type: String, 
    enum: [
      'TEXT', 'TEXTAREA', 'NUMBER', 'EMAIL', 'PHONE', 'DATE', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'YES_NO',
      'text', 'number', 'email', 'phone', 'date', 'select', 'radio', 'checkbox', 'textarea', 'file'
    ],
    required: true 
  },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  placeholder: { type: String },
  helpText: { type: String },
  order: { type: Number, default: 0 }
}, { _id: false });

const imageStorageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  width: { type: Number },
  height: { type: Number }
}, { _id: false });

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true
    },
    slug: {
      type: String,
      required: [true, 'Event slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      enum: EVENT_CATEGORIES,
      required: [true, 'Category is required'],
      index: true
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      maxlength: 300
    },
    fullDescription: {
      type: String,
      required: [true, 'Full description is required']
    },
    organizer: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String },
      logoUrl: { type: String }
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
      index: true
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    registrationOpenDate: { type: Date },
    registrationCloseDate: { type: Date },
    venue: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    country: { type: String, default: 'India' },
    mapUrl: { type: String },
    
    posterUrl: { type: String },
    bannerUrl: { type: String },
    poster: imageStorageSchema,
    banner: imageStorageSchema,
    galleryUrls: [{ type: String }],
    
    isPaid: {
      type: Boolean,
      default: false,
      index: true
    },
    price: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR'
    },
    platformFee: {
      type: Number,
      default: 0
    },
    
    capacity: {
      type: Number,
      default: 0 // 0 means unlimited if isUnlimitedCapacity is true
    },
    availableSlots: {
      type: Number,
      default: 0
    },
    isUnlimitedCapacity: {
      type: Boolean,
      default: false
    },
    
    status: {
      type: String,
      enum: Object.values(EVENT_STATUS),
      default: EVENT_STATUS.DRAFT,
      index: true
    },
    
    customFields: [customFieldSchema],
    
    registrationConfig: {
      requiredProfileFields: [{ type: String }], // Array of required profile keys e.g. ['dob', 'bloodGroup', 'tShirtSize']
      raceFields: {
        vehicleModel: { type: String, enum: ['HIDDEN', 'OPTIONAL', 'REQUIRED'], default: 'HIDDEN' },
        vehicleNumber: { type: String, enum: ['HIDDEN', 'OPTIONAL', 'REQUIRED'], default: 'HIDDEN' },
        licenseNumber: { type: String, enum: ['HIDDEN', 'OPTIONAL', 'REQUIRED'], default: 'HIDDEN' },
        teamName: { type: String, enum: ['HIDDEN', 'OPTIONAL', 'REQUIRED'], default: 'HIDDEN' },
        categoryClass: { type: String, enum: ['HIDDEN', 'OPTIONAL', 'REQUIRED'], default: 'HIDDEN' }
      },
      minAge: { type: Number, default: 0 },
      customFields: [customFieldSchema],
      customQuestions: [customFieldSchema]
    },

    raceConfig: {
      vehicleType: { type: String },
      raceCategory: { type: String },
      distance: { type: String },
      trackName: { type: String },
      safetyRequirements: { type: String },
      licenseRequired: { type: Boolean, default: false },
      ageRestrictions: { type: String }
    },
    
    rules: [{ type: String }],
    terms: [{ type: String }],
    cancellationPolicy: { type: String },
    
    viewCount: { type: Number, default: 0 },
    hasLeaderboard: { type: Boolean, default: false },
    leaderboardTitle: { type: String, default: 'Leaderboard' }
  },
  {
    timestamps: true
  }
);

// Composite indexes for fast queries
eventSchema.index({ status: 1, eventDate: 1 });
eventSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Event', eventSchema);
