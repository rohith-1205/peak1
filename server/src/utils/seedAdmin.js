/**
 * CLI Seed script to create or update an administrator account.
 * Reads credentials from ADMIN_EMAIL and ADMIN_PASSWORD environment variables.
 * Run via: npm run seed:admin
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const { ROLES } = require('../constants');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedAdmin = async () => {
  try {
    if (env.APP_ENV === 'production' && process.env.FORCE_SEED !== 'true') {
      console.error('[SeedAdmin Error]: Refusing to run in production. Set FORCE_SEED=true to override.');
      process.exit(1);
    }

    const email = env.ADMIN_EMAIL ? env.ADMIN_EMAIL.toLowerCase().trim() : '';
    const password = process.env.SEED_ADMIN_PASSWORD ? process.env.SEED_ADMIN_PASSWORD.trim() : '';

    if (!email) {
      console.error('[SeedAdmin Error]: ADMIN_EMAIL environment variable is required.');
      process.exit(1);
    }
    if (!password) {
      console.error('[SeedAdmin Error]: SEED_ADMIN_PASSWORD environment variable is required.');
      process.exit(1);
    }

    const finalEmail = email;
    const finalPassword = password;

    const mongoUri = env.MONGO_URI;
    console.log(`[SeedAdmin] Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    let admin = await User.findOne({ email: finalEmail });

    if (admin) {
      console.log(`[SeedAdmin] Updating existing user "${finalEmail}" to ADMIN role...`);
      admin.role = ROLES.ADMIN;
      admin.password = finalPassword;
      await admin.save();
    } else {
      console.log(`[SeedAdmin] Creating new administrator account for "${finalEmail}"...`);
      admin = await User.create({
        name: env.ADMIN_NAME || 'Peak1 Administrator',
        email: finalEmail,
        password: finalPassword,
        role: ROLES.ADMIN,
        phone: '+91 98765 43210'
      });
    }

    console.log('==================================================');
    console.log(' ADMINISTRATOR ACCOUNT PROVISIONED');
    console.log(` Email    : ${admin.email}`);
    console.log(` Role     : ${admin.role}`);
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[SeedAdmin Error]:', error);
    process.exit(1);
  }
};

seedAdmin();
