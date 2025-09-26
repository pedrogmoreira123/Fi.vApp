import { db } from '../config/database';
import { logger } from '../config/logger';

// Base service class with common functionality
export abstract class BaseService {
  protected db = db;
  protected logger = logger;

  // Generic error handling
  protected handleError(error: any, context: string): never {
    this.logger.error({
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
    }, 'Service error');

    throw error;
  }

  // Generic success response
  protected successResponse<T>(data: T, message?: string) {
    return {
      success: true,
      data,
      message,
    };
  }

  // Generic error response
  protected errorResponse(message: string, code?: string) {
    return {
      success: false,
      error: message,
      code,
    };
  }
}
