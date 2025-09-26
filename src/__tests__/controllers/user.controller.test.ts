import request from 'supertest';
import app from '../../app';
import { db } from '../../config/database';

// Mock the database
jest.mock('../../config/database', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('UserController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'user',
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

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
        name: 'A', // Too short
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
    });
  });

  describe('POST /api/users/login', () => {
    it('should login with valid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        id: '1',
        email: loginData.email,
        password: '$2a$12$hashed_password',
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

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('user');
    });

    it('should return 401 for invalid credentials', async () => {
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

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });
});
