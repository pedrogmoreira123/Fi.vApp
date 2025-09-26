import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { BaseService } from './base.service';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../middleware/error';
import { generateToken, generateRefreshToken } from '../middleware/auth';

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['user', 'admin']).default('user'),
});

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(['user', 'admin']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export class UserService extends BaseService {
  // Create a new user
  async createUser(input: CreateUserInput) {
    try {
      // Check if user already exists
      const existingUser = await this.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new AppError('User with this email already exists', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Create user
      const [newUser] = await this.db
        .insert(users)
        .values({
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: input.role,
        })
        .returning();

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      this.logger.info({
        userId: newUser.id,
        email: newUser.email,
      }, 'User created successfully');

      return this.successResponse(userWithoutPassword, 'User created successfully');
    } catch (error) {
      this.handleError(error, 'createUser');
    }
  }

  // Authenticate user
  async login(input: LoginInput) {
    try {
      // Find user by email
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(input.password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      // Generate tokens
      const token = generateToken({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        id: user.id,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      this.logger.info({
        userId: user.id,
        email: user.email,
      }, 'User logged in successfully');

      return this.successResponse({
        user: userWithoutPassword,
        token,
        refreshToken,
      }, 'Login successful');
    } catch (error) {
      this.handleError(error, 'login');
    }
  }

  // Get user by ID
  async getUserById(id: string) {
    try {
      const [user] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return this.successResponse(userWithoutPassword);
    } catch (error) {
      this.handleError(error, 'getUserById');
    }
  }

  // Update user
  async updateUser(id: string, input: UpdateUserInput) {
    try {
      // Check if user exists
      const [existingUser] = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);

      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // Check if email is being changed and if it's already taken
      if (input.email && input.email !== existingUser.email) {
        const [emailExists] = await this.db
          .select()
          .from(users)
          .where(eq(users.email, input.email))
          .limit(1);

        if (emailExists) {
          throw new AppError('Email already in use', 400);
        }
      }

      // Update user
      const [updatedUser] = await this.db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning();

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;

      this.logger.info({
        userId: id,
        changes: input,
      }, 'User updated successfully');

      return this.successResponse(userWithoutPassword, 'User updated successfully');
    } catch (error) {
      this.handleError(error, 'updateUser');
    }
  }

  // Delete user
  async deleteUser(id: string) {
    try {
      const [deletedUser] = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning();

      if (!deletedUser) {
        throw new AppError('User not found', 404);
      }

      this.logger.info({
        userId: id,
      }, 'User deleted successfully');

      return this.successResponse(null, 'User deleted successfully');
    } catch (error) {
      this.handleError(error, 'deleteUser');
    }
  }

  // Get all users (admin only)
  async getAllUsers(page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const allUsers = await this.db
        .select({
          id: users.id,
          email: users.email,
          name: users.name,
          role: users.role,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .limit(limit)
        .offset(offset);

      const [totalCount] = await this.db
        .select({ count: users.id })
        .from(users);

      return this.successResponse({
        users: allUsers,
        pagination: {
          page,
          limit,
          total: totalCount.count,
          pages: Math.ceil(totalCount.count / limit),
        },
      });
    } catch (error) {
      this.handleError(error, 'getAllUsers');
    }
  }
}
