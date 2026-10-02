const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (env.CLIENT_URLS.includes(origin)) {
      return callback(null, true);
    }
    
    if (env.APP_ENV === 'staging' && process.env.ALLOW_VERCEL_PREVIEWS === 'true') {
      const vercelRegex = /^https:\/\/.*\.vercel\.app$/;
      if (vercelRegex.test(origin)) {
        return callback(null, true);
      }
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

module.exports = corsOptions;
