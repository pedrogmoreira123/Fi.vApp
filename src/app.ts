import express, { Application } from 'express';
import { env } from './config/environment';
import { logger, requestLogger } from './config/logger';
import { 
  securityHeaders, 
  rateLimiter, 
  corsMiddleware, 
  requestIdMiddleware 
} from './middleware/security';
import { errorHandler, notFoundHandler } from './middleware/error';
import apiRoutes from './routes';

// Create Express application
const app: Application = express();

// Trust proxy for accurate IP addresses
app.set('trust proxy', 1);

// Security middleware
app.use(securityHeaders);
app.use(rateLimiter);
app.use(corsMiddleware);
app.use(requestIdMiddleware);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// API routes
app.use('/api', apiRoutes);

// 404 handler (must be before error handler)
app.use(notFoundHandler);

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
