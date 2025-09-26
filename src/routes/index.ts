import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../config/logger';
import userRoutes from './user.routes';
// Import other route modules as they are created
// import whatsappRoutes from './whatsapp.routes';
// import evolutionRoutes from './evolution.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API version info
router.get('/version', (req: Request, res: Response) => {
  res.json({
    name: 'Fi.V App API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'WhatsApp integration platform with Evolution API',
  });
});

// Mount route modules
router.use('/users', userRoutes);
// router.use('/whatsapp', whatsappRoutes);
// router.use('/evolution', evolutionRoutes);

// API documentation endpoint
router.get('/docs', (req: Request, res: Response) => {
  res.json({
    message: 'API Documentation',
    endpoints: {
      health: 'GET /api/health',
      version: 'GET /api/version',
      users: {
        register: 'POST /api/users/register',
        login: 'POST /api/users/login',
        profile: 'GET /api/users/profile',
        updateProfile: 'PUT /api/users/profile',
        // Admin routes
        getAllUsers: 'GET /api/users/users',
        getUserById: 'GET /api/users/users/:id',
        updateUser: 'PUT /api/users/users/:id',
        deleteUser: 'DELETE /api/users/users/:id',
      },
    },
  });
});

export default router;
