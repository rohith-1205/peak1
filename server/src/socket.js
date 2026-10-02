const { Server } = require('socket.io');
const env = require('./config/env');

let io;

module.exports = {
  init: (httpServer) => {
    // Phase 2 will handle CORS logic, keeping this simple for now.
    io = new Server(httpServer, {
      cors: {
        origin: env.CLIENT_URL, // Temporarily use CLIENT_URL, Phase 2 will replace this
        methods: ['GET', 'POST', 'PATCH', 'DELETE']
      }
    });

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    return io;
  },
  getIO: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  }
};
