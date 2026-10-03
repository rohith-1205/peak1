const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const cleanOrigin = origin.replace(/\/$/, '');
    const allowedUrls = env.CLIENT_URLS.map(u => u.trim().replace(/\/$/, ''));

    if (allowedUrls.includes(cleanOrigin) || allowedUrls.includes('*')) {
      return callback(null, true);
    }
    
    // Always allow Vercel deployment URLs (*.vercel.app)
    const vercelRegex = /^https:\/\/.*\.vercel\.app$/;
    if (vercelRegex.test(cleanOrigin)) {
      return callback(null, true);
    }
    
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
};

module.exports = corsOptions;
