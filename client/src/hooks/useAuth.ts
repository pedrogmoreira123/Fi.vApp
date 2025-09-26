import { useState, useEffect, useCallback } from 'react';
import { AuthService, type User } from '../services/auth.service';
import { type AuthResponse } from '../services/api';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: 'user' | 'admin') => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshToken: () => Promise<void>;
  error: string | null;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated
  const isAuthenticated = AuthService.isAuthenticated() && !!user;

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated
        if (AuthService.isAuthenticated()) {
          // Try to get stored user first
          const storedUser = AuthService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
          } else {
            // Fetch user profile if not stored
            const userProfile = await AuthService.getProfile();
            setUser(userProfile);
            AuthService.storeUser(userProfile);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        AuthService.logout();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await AuthService.login(email, password);
      setUser(response.user);
      AuthService.storeUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register function
  const register = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'user' | 'admin' = 'user'
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await AuthService.register(email, password, name, role);
      setUser(response.user);
      AuthService.storeUser(response.user);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function
  const logout = useCallback(() => {
    AuthService.logout();
    setUser(null);
    setError(null);
  }, []);

  // Update profile function
  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      setIsLoading(true);
      setError(null);

      const updatedUser = await AuthService.updateProfile(data);
      setUser(updatedUser);
      AuthService.storeUser(updatedUser);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh token function
  const refreshToken = useCallback(async () => {
    try {
      const response = await AuthService.refreshToken();
      setUser(response.user);
      AuthService.storeUser(response.user);
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      logout();
      throw error;
    }
  }, [logout]);

  // Auto refresh token when it's about to expire
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkTokenExpiration = () => {
      if (AuthService.isTokenExpired()) {
        refreshToken().catch(() => {
          // If refresh fails, logout
          logout();
        });
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    // Initial check
    checkTokenExpiration();

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken, logout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    error,
  };
};
