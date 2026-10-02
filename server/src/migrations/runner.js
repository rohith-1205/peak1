/**
 * Database Migration Runner Script
 * Connects to MongoDB and executes registered migration scripts.
 * Run via: npm run migrate
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const runFeature4Migration = require('./migration_feature4_profiles_and_config');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const runAllMigrations = async () => {
  try {
    const isApply = process.argv.includes('--apply');
    const mongoUri = env.MONGO_URI || 'mongodb://localhost:27017/peak1_dev';
    console.log(`[Migrate] Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Migrate] Executing database migrations...');
    await runFeature4Migration(isApply);

    console.log('==================================================');
    console.log(` DATABASE MIGRATIONS COMPLETED (${isApply ? 'APPLIED' : 'DRY-RUN'})`);
    console.log('==================================================');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('[Migrate Error]:', error);
    process.exit(1);
  }
};

runAllMigrations();

