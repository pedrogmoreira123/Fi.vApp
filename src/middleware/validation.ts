import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '../config/logger';

// Generic validation middleware
export const validate = (schema: ZodSchema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[property];
      const validatedData = schema.parse(data);
      
      // Replace the original data with validated data
      req[property] = validatedData;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn({
          validationErrors,
          property,
          path: req.path,
          method: req.method,
        }, 'Validation failed');

        return res.status(400).json({
          error: 'Validation failed',
          details: validationErrors,
        });
      }

      logger.error({ error }, 'Validation middleware error');
      return res.status(500).json({
        error: 'Internal server error during validation',
      });
    }
  };
};

// File upload validation middleware
export const validateFileUpload = (maxSize: number = 10 * 1024 * 1024, allowedTypes: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      return next();
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        error: 'File too large',
        maxSize: maxSize,
        actualSize: req.file.size,
      });
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        allowedTypes,
        actualType: req.file.mimetype,
      });
    }

    next();
  };
};
