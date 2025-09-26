import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { createUserSchema, updateUserSchema, loginSchema } from '../services/user.service';
import { validate } from '../middleware/validation';
import { asyncHandler } from '../middleware/error';
import { logger } from '../config/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Create user
  createUser = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.createUser(req.body);
    res.status(201).json(result);
  });

  // Login user
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.login(req.body);
    res.json(result);
  });

  // Get current user profile
  getProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await this.userService.getUserById(userId);
    res.json(result);
  });

  // Update user profile
  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const result = await this.userService.updateUser(userId, req.body);
    res.json(result);
  });

  // Get user by ID (admin only)
  getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.userService.getUserById(id);
    res.json(result);
  });

  // Update user by ID (admin only)
  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.userService.updateUser(id, req.body);
    res.json(result);
  });

  // Delete user (admin only)
  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.userService.deleteUser(id);
    res.json(result);
  });

  // Get all users (admin only)
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const result = await this.userService.getAllUsers(page, limit);
    res.json(result);
  });
}

// Validation middleware for routes
export const userValidation = {
  createUser: validate(createUserSchema),
  login: validate(loginSchema),
  updateProfile: validate(updateUserSchema),
  updateUser: validate(updateUserSchema),
};
