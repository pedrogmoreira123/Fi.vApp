import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { logger } from '../config/logger';
import { AppError } from './error';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// JWT token verification middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: 'Access token required',
    });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
    next();
  } catch (error) {
    logger.warn({
      error: error instanceof Error ? error.message : 'Unknown error',
      token: token.substring(0, 20) + '...',
      ip: req.ip,
    }, 'Invalid token');

    return res.status(403).json({
      error: 'Invalid or expired token',
    });
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        user: req.user,
        requiredRoles: roles,
        ip: req.ip,
      }, 'Insufficient permissions');

      return res.status(403).json({
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (error) {
    // Silently fail for optional auth
    logger.debug({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 'Optional auth failed');
  }

  next();
};

// Generate JWT token
export const generateToken = (payload: { id: string; email: string; role: string }) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '24h',
    issuer: 'fi-v-app',
    audience: 'fi-v-app-users',
  });
};

// Generate refresh token
export const generateRefreshToken = (payload: { id: string }) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d',
    issuer: 'fi-v-app',
    audience: 'fi-v-app-refresh',
  });
};
