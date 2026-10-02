const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      autoIndex: env.APP_ENV === 'development', // Enable autoIndex in dev, manage explicitly in prod
    });

    if ((env.APP_ENV === 'staging' || env.APP_ENV === 'development') && conn.connection.name.includes('prod')) {
      console.error(`[Peak1 DB] FATAL: Refusing to connect to a production database (${conn.connection.name}) in ${env.APP_ENV} environment.`);
      process.exit(1);
    }

    console.log(`[Peak1 DB] MongoDB Connected: ${conn.connection.host} (${conn.connection.name})`);
    return conn;
  } catch (error) {
    console.error(`[Peak1 DB] Database Connection Error: ${error.message}`);
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
