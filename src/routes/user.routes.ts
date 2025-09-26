import { Router } from 'express';
import { UserController, userValidation } from '../controllers/user.controller';
import { authenticateToken, authorize } from '../middleware/auth';

const router = Router();
const userController = new UserController();

// Public routes
router.post('/register', userValidation.createUser, userController.createUser);
router.post('/login', userValidation.login, userController.login);

// Protected routes (require authentication)
router.use(authenticateToken);

// User profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userValidation.updateProfile, userController.updateProfile);

// Admin routes (require admin role)
router.get('/users', authorize('admin'), userController.getAllUsers);
router.get('/users/:id', authorize('admin'), userController.getUserById);
router.put('/users/:id', authorize('admin'), userValidation.updateUser, userController.updateUser);
router.delete('/users/:id', authorize('admin'), userController.deleteUser);

export default router;
