import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

// Custom error class
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] as string;
  
  // Log error
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      id: requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  }, 'Unhandled error');

  // Handle different error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      requestId,
    });
  }

  if (error instanceof ZodError) {
    const validationErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));

    return res.status(400).json({
      error: 'Validation failed',
      details: validationErrors,
      requestId,
    });
  }

  // Handle database errors
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database operation failed',
      requestId,
    });
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid token',
      requestId,
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      requestId,
    });
  }

  // Default error response
  const statusCode = (error as any).statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    error: message,
    requestId,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  const requestId = req.headers['x-request-id'] as string;
  
  logger.warn({
    request: {
      id: requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
    },
  }, 'Route not found');

  res.status(404).json({
    error: 'Route not found',
    requestId,
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
