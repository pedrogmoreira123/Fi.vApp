import { createServer } from 'http';
import app from './app';
import { env } from './config/environment';
import { logger } from './config/logger';
import { initSocket } from './socket';

// Create HTTP server
const server = createServer(app);

// Initialize Socket.IO with JWT authentication
const io = initSocket(server);

// Make io available globally for use in other modules
(global as any).io = io;

// WhatsApp routes are now handled by the centralized route modules

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
