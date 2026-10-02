const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false
    },
    phone: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.USER,
      index: true
    },
    isVerified: {
      type: Boolean,
      default: true
    },
    profile: {
      dob: { type: Date },
      gender: { 
        type: String, 
        enum: ['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say'] 
      },
      city: { type: String, trim: true },
      state: { type: String, trim: true },
      emergencyContactName: { type: String, trim: true },
      emergencyContactPhone: { type: String, trim: true },
      bloodGroup: { 
        type: String, 
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] 
      },
      tShirtSize: { 
        type: String, 
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] 
      },
      profileCompletedAt: { type: Date }
    }
  },
  {
    timestamps: true
  }
);

// Helper method to check missing required profile fields for an event
userSchema.methods.getMissingProfileFields = function (requiredFields = []) {
  const missing = [];
  const profile = this.profile || {};

  requiredFields.forEach((field) => {
    // Baseline mandatory account fields
    if (field === 'fullName' && !this.name) missing.push('fullName');
    if (field === 'email' && !this.email) missing.push('email');
    if (field === 'phone' && !this.phone) missing.push('phone');

    // Profile fields
    if (field === 'emergencyContactName' && !profile.emergencyContactName) missing.push('emergencyContactName');
    if (field === 'emergencyContactPhone' && !profile.emergencyContactPhone) missing.push('emergencyContactPhone');
    if (field === 'dob' && !profile.dob) missing.push('dob');
    if (field === 'gender' && !profile.gender) missing.push('gender');
    if (field === 'city' && !profile.city) missing.push('city');
    if (field === 'state' && !profile.state) missing.push('state');
    if (field === 'bloodGroup' && !profile.bloodGroup) missing.push('bloodGroup');
    if (field === 'tShirtSize' && !profile.tShirtSize) missing.push('tShirtSize');
  });

  return missing;
};

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
