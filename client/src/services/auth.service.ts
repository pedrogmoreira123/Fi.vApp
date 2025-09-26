import { apiClient, endpoints, type AuthResponse, type User } from './api';

export class AuthService {
  // Login user
  static async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(endpoints.auth.login, {
      email,
      password,
    });

    // Store tokens in localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    return response;
  }

  // Register user
  static async register(
    email: string,
    password: string,
    name: string,
    role: 'user' | 'admin' = 'user'
  ): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(endpoints.auth.register, {
      email,
      password,
      name,
      role,
    });

    // Store tokens in localStorage
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    return response;
  }

  // Get current user profile
  static async getProfile(): Promise<User> {
    const response = await apiClient.get<{ data: User }>(endpoints.auth.profile);
    return response.data;
  }

  // Update user profile
  static async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.put<{ data: User }>(endpoints.auth.profile, data);
    return response.data;
  }

  // Refresh token
  static async refreshToken(): Promise<AuthResponse> {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<AuthResponse>(endpoints.auth.refresh, {
      refreshToken,
    });

    // Update stored tokens
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    if (response.refreshToken) {
      localStorage.setItem('refresh_token', response.refreshToken);
    }

    return response;
  }

  // Logout user
  static logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  // Get stored user data
  static getStoredUser(): User | null {
    const userData = localStorage.getItem('user');
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }

  // Store user data
  static storeUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  }

  // Get auth token
  static getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Check token expiration
  static isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}
