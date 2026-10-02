const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');
const socketConfig = require('./socket');

const startServer = async () => {
  try {
    const db = await connectDB();
    const PORT = env.PORT || 5000;
    
    // Create HTTP server from the Express app
    const server = require('http').createServer(app);
    
    // Initialize Socket.io
    socketConfig.init(server);

    server.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(` PEAK1 EVENT PLATFORM BACKEND READY              `);
      console.log(` App Env     : ${env.APP_ENV}`);
      console.log(` Node Env    : ${env.NODE_ENV}`);
      console.log(` Database    : ${db.connection.name}`);
      console.log(` Server Port : ${PORT}`);
      console.log(` Client URLs : ${env.CLIENT_URLS.join(', ')}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
