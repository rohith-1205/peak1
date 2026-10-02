const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const getClientUrls = () => {
  const urlString = process.env.CLIENT_URL || 'http://localhost:5173';
  return urlString.split(',').map(url => url.trim());
};

const env = {
  // App
  APP_ENV: process.env.APP_ENV || 'development', // 'development' | 'staging' | 'production'
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  SERVER_URL: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  CLIENT_URLS: getClientUrls(),

  // Database
  MONGO_URI: process.env.MONGO_URI,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ADMIN_JWT_EXPIRES_IN: process.env.ADMIN_JWT_EXPIRES_IN || '8h',
  ALLOW_ADMIN_PUBLIC_LOGIN: process.env.ALLOW_ADMIN_PUBLIC_LOGIN || 'false',

  // Email
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Payments
  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'RAZORPAY',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,

  // Storage
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER || 'local').toLowerCase(),
  UPLOAD_PATH: process.env.UPLOAD_PATH || 'public/uploads',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // QR
  QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET,

  // Admin Seeding
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  ADMIN_NAME: process.env.ADMIN_NAME || 'Peak1 Administrator'
};

// Startup Validation
const validateEnv = () => {
  const missing = [];

  // Always required
  if (!env.MONGO_URI) missing.push('MONGO_URI');
  if (!env.JWT_SECRET) missing.push('JWT_SECRET');

  // Required in production/staging (NODE_ENV=production)
  if (env.NODE_ENV === 'production') {
    if (!process.env.CLIENT_URL) missing.push('CLIENT_URL');
    if (!env.QR_SIGNING_SECRET) missing.push('QR_SIGNING_SECRET');
    if (!env.EMAIL_HOST) missing.push('EMAIL_HOST');
    if (!process.env.EMAIL_PORT) missing.push('EMAIL_PORT');
    if (!env.EMAIL_USER) missing.push('EMAIL_USER');
    if (!env.EMAIL_PASS) missing.push('EMAIL_PASS');

    if (env.STORAGE_PROVIDER === 'local') {
      console.warn('⚠️ WARNING: STORAGE_PROVIDER is "local" in production. Uploaded files will be lost on restart.');
    }
  }

  if (missing.length > 0) {
    throw new Error(`❌ Missing environment variables: ${missing.join(', ')}. Check your Render dashboard.`);
  }
};

validateEnv();

module.exports = env;
