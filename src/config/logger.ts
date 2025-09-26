import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

// Request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  req.logger = logger.child({
    requestId: req.headers['x-request-id'] || Math.random().toString(36).substr(2, 9),
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    req.logger.info({
      statusCode: res.statusCode,
      duration,
    }, 'Request completed');
  });

  next();
};

export default logger;
