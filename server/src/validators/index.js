const { z } = require('zod');
const { EVENT_CATEGORIES, EVENT_STATUS } = require('../constants');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  role: z.enum(['USER', 'ADMIN']).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const adminLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const updateProfileSchema = z.object({
  dob: z.string().or(z.date()).optional().nullable().refine((val) => {
    if (!val) return true;
    return new Date(val) < new Date();
  }, { message: 'Date of birth must be in the past' }),
  gender: z.enum(['Male', 'Female', 'Non-Binary', 'Other', 'Prefer not to say']).optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[6-9]\d{9}$/.test(val.replace(/\s+/g, '')) || val.length >= 8;
  }, { message: 'Invalid emergency contact mobile phone number' }),
  phone: z.string().optional().refine((val) => {
    if (!val) return true;
    return /^[6-9]\d{9}$/.test(val.replace(/\s+/g, '')) || val.length >= 8;
  }, { message: 'Invalid 10-digit mobile phone number' }),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  tShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).optional()
});

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  category: z.string().optional().or(z.literal('')),
  shortDescription: z.string().optional().or(z.literal('')),
  fullDescription: z.string().optional().or(z.literal('')),
  organizer: z.object({
    name: z.string().optional().or(z.literal('')),
    email: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    logoUrl: z.string().optional().or(z.literal(''))
  }).optional(),
  eventDate: z.string().or(z.date()).optional().or(z.literal('')),
  startTime: z.string().optional().or(z.literal('')),
  endTime: z.string().optional().or(z.literal('')),
  registrationOpenDate: z.string().or(z.date()).optional().or(z.literal('')),
  registrationCloseDate: z.string().or(z.date()).optional().or(z.literal('')),
  venue: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  mapUrl: z.string().optional().or(z.literal('')),
  posterUrl: z.string().optional().or(z.literal('')),
  bannerUrl: z.string().optional().or(z.literal('')),
  galleryUrls: z.array(z.string()).optional(),
  isPaid: z.boolean().optional(),
  price: z.number().min(0).optional(),
  currency: z.string().optional(),
  capacity: z.number().min(0).optional(),
  isUnlimitedCapacity: z.boolean().optional(),
  status: z.enum(Object.values(EVENT_STATUS)).optional(),
  customFields: z.array(z.object({
    fieldId: z.string(),
    label: z.string(),
    type: z.enum(['text', 'number', 'email', 'phone', 'date', 'select', 'radio', 'checkbox', 'textarea', 'file']),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(),
    placeholder: z.string().optional()
  })).optional(),
  raceConfig: z.object({
    vehicleType: z.string().optional().or(z.literal('')),
    raceCategory: z.string().optional().or(z.literal('')),
    distance: z.string().optional().or(z.literal('')),
    trackName: z.string().optional().or(z.literal('')),
    safetyRequirements: z.string().optional().or(z.literal('')),
    licenseRequired: z.boolean().optional()
  }).optional(),
  rules: z.array(z.string()).optional(),
  terms: z.array(z.string()).optional(),
  cancellationPolicy: z.string().optional().or(z.literal(''))
});

const registrationSchema = z.object({
  participantDetails: z.object({
    fullName: z.string().min(2, 'Full name required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(8, 'Phone number required'),
    dob: z.string().optional(),
    gender: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    emergencyContact: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    bloodGroup: z.string().optional(),
    tShirtSize: z.string().optional()
  }),
  saveToProfile: z.boolean().optional(),
  customResponses: z.record(z.any()).optional(),
  raceDetails: z.object({
    vehicleModel: z.string().optional(),
    vehicleNumber: z.string().optional(),
    drivingLicense: z.string().optional(),
    teamName: z.string().optional()
  }).optional()
});

/**
 * Dynamically builds a Zod schema based on an Event's registrationConfig.
 * Validates required profile fields, race fields (REQUIRED/OPTIONAL/HIDDEN), minAge, and custom questions.
 */
const buildRegistrationSchema = (registrationConfig = {}) => {
  const requiredProfile = registrationConfig.requiredProfileFields || [];
  const raceConfig = registrationConfig.raceFieldsConfig || {};
  const customQuestions = registrationConfig.customQuestions || registrationConfig.customFields || [];
  const minAge = registrationConfig.minAge || 0;

  // 1. Participant Details Schema
  const participantShape = {
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Valid email address is required'),
    phone: z.string().min(8, 'Phone number is required')
  };

  const profileFieldMap = {
    dob: z.string().or(z.date()).refine((val) => val && !isNaN(new Date(val).getTime()), { message: 'Date of birth is required' }),
    gender: z.string().min(1, 'Gender is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
    emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
    bloodGroup: z.string().min(1, 'Blood group is required'),
    tShirtSize: z.string().min(1, 'T-shirt size is required')
  };

  requiredProfile.forEach((field) => {
    if (profileFieldMap[field]) {
      participantShape[field] = profileFieldMap[field];
    }
  });

  // minAge validation if required
  let participantDetailsSchema = z.object(participantShape).passthrough();

  if (minAge > 0) {
    participantDetailsSchema = participantDetailsSchema.refine((data) => {
      const dobVal = data.dob;
      if (!dobVal) return false;
      const birthDate = new Date(dobVal);
      if (isNaN(birthDate.getTime())) return false;

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= minAge;
    }, {
      message: `Participant must be at least ${minAge} years old`,
      path: ['dob']
    });
  }

  // 2. Race Details Schema
  const raceShape = {};
  ['vehicleModel', 'vehicleNumber', 'drivingLicense', 'teamName', 'categoryClass'].forEach((field) => {
    const configSetting = raceConfig[field] || 'OPTIONAL';
    if (configSetting === 'REQUIRED') {
      raceShape[field] = z.string().min(1, `${field.replace(/([A-Z])/g, ' $1')} is required for this race`);
    } else {
      raceShape[field] = z.string().optional().or(z.literal(''));
    }
  });
  const raceDetailsSchema = z.object(raceShape).passthrough();

  // 3. Custom Responses Schema
  const customShape = {};
  customQuestions.forEach((q) => {
    const key = q.fieldId || q.id;
    if (!key) return;

    if (q.required) {
      if (q.type === 'number') {
        customShape[key] = z.any().refine((val) => val !== undefined && val !== null && val !== '', {
          message: `"${q.label}" is required`
        });
      } else if (q.type === 'checkbox') {
        customShape[key] = z.any().refine((val) => {
          if (Array.isArray(val)) return val.length > 0;
          return Boolean(val);
        }, { message: `"${q.label}" is required` });
      } else {
        customShape[key] = z.any().refine((val) => val && String(val).trim().length > 0, {
          message: `"${q.label}" is required`
        });
      }
    } else {
      customShape[key] = z.any().optional();
    }
  });

  const customResponsesSchema = z.object(customShape).passthrough();

  return z.object({
    participantDetails: participantDetailsSchema,
    raceDetails: raceDetailsSchema.optional(),
    customResponses: customResponsesSchema.optional(),
    saveToProfile: z.boolean().optional()
  });
};

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errorCode: 'VALIDATION_ERROR',
        errors: messages
      });
    }
    next(error);
  }
};

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters long')
});

module.exports = {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  createEventSchema,
  registrationSchema,
  buildRegistrationSchema,
  validate
};

