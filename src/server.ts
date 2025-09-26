import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import app from './app';
import { env } from './config/environment';
import { logger } from './config/logger';

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Make io available globally for use in other modules
(global as any).io = io;

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info({ socketId: socket.id }, 'Client connected');

  socket.on('disconnect', (reason) => {
    logger.info({ socketId: socket.id, reason }, 'Client disconnected');
  });

  // Handle WhatsApp events
  socket.on('whatsapp:join', (data) => {
    logger.info({ socketId: socket.id, data }, 'WhatsApp join event');
    socket.join(`whatsapp:${data.instanceId}`);
  });

  socket.on('whatsapp:leave', (data) => {
    logger.info({ socketId: socket.id, data }, 'WhatsApp leave event');
    socket.leave(`whatsapp:${data.instanceId}`);
  });
});

// Start server
const startServer = async () => {
  try {
    // Validate environment
    logger.info({
      environment: env.NODE_ENV,
      port: env.PORT,
      database: env.DATABASE_URL ? 'configured' : 'not configured',
    }, 'Starting server with configuration');

    server.listen(env.PORT, '0.0.0.0', () => {
      logger.info({
        port: env.PORT,
        environment: env.NODE_ENV,
        pid: process.pid,
      }, 'Server started successfully');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof env.PORT === 'string' ? 'Pipe ' + env.PORT : 'Port ' + env.PORT;

      switch (error.code) {
        case 'EACCES':
          logger.error({ bind }, 'Permission denied');
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error({ bind }, 'Address already in use');
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Start the server
startServer();

export { server, io };
