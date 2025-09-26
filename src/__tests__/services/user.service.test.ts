import { UserService } from '../../services/user.service';
import { db } from '../../config/database';
import { users } from '../../../shared/schema';

// Mock the database
jest.mock('../../config/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    userService = new UserService();
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user' as const,
      };

      // Mock database responses
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No existing user
          }),
        }),
      });

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{
            id: '1',
            email: userData.email,
            name: userData.name,
            role: userData.role,
            password: 'hashed_password',
            createdAt: new Date(),
            updatedAt: new Date(),
          }]),
        }),
      });

      const result = await userService.createUser(userData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('email', userData.email);
      expect(result.data).not.toHaveProperty('password');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user' as const,
      };

      // Mock existing user
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: '1', email: userData.email }]),
          }),
        }),
      });

      await expect(userService.createUser(userData)).rejects.toThrow('User with this email already exists');
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: loginData.email,
        password: '$2a$12$hashed_password', // bcrypt hash
        name: 'Test User',
        role: 'user',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Mock bcrypt.compare
      const bcrypt = require('bcryptjs');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await userService.login(loginData);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('token');
      expect(result.data).toHaveProperty('refreshToken');
      expect(result.data.user).toHaveProperty('email', loginData.email);
    });

    it('should throw error for invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]), // No user found
          }),
        }),
      });

      await expect(userService.login(loginData)).rejects.toThrow('Invalid credentials');
    });
  });
});
