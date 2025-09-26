import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/environment';

// Helmet security middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting middleware
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(env.RATE_LIMIT_WINDOW_MS / 1000),
    });
  },
});

// CORS middleware
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  const allowedOrigins = env.CORS_ORIGIN === '*' ? ['*'] : env.CORS_ORIGIN.split(',');

  if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
    res.header('Access-Control-Allow-Origin', origin || '*');
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Request-ID');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
};

// Request ID middleware
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.headers['x-request-id'] as string || 
                   Math.random().toString(36).substr(2, 9);
  
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);
  
  next();
};
