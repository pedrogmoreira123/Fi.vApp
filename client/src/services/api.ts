import { env } from '../../env';

// API Configuration
const API_BASE_URL = env.VITE_API_URL || 'http://localhost:3000/api';

// Request configuration
const defaultHeaders = {
  'Content-Type': 'application/json',
};

// API Client class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string, headers: Record<string, string> = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = headers;
  }

  // Get auth token from localStorage
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Build request headers
  private buildHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
    const token = this.getAuthToken();
    return {
      ...this.defaultHeaders,
      ...(token && { Authorization: `Bearer ${token}` }),
      ...customHeaders,
    };
  }

  // Handle API response
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // GET request
  async get<T>(endpoint: string, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: this.buildHeaders(headers),
    });

    return this.handleResponse<T>(response);
  }

  // POST request
  async post<T>(endpoint: string, data: any, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(headers),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // PUT request
  async put<T>(endpoint: string, data: any, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: this.buildHeaders(headers),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  // DELETE request
  async delete<T>(endpoint: string, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: this.buildHeaders(headers),
    });

    return this.handleResponse<T>(response);
  }

  // PATCH request
  async patch<T>(endpoint: string, data: any, headers: Record<string, string> = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      headers: this.buildHeaders(headers),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL, defaultHeaders);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/me',
    refresh: '/auth/refresh',
  },
  
  // WhatsApp
  whatsapp: {
    instances: '/whatsapp/instances',
    connect: '/whatsapp/connect',
    disconnect: '/whatsapp/disconnect',
    status: '/whatsapp/status',
    send: '/whatsapp/send',
    messages: '/whatsapp/messages',
    instance: '/whatsapp/instance',
    instanceConnect: '/whatsapp/instance/connect',
    instanceDisconnect: '/whatsapp/instance/disconnect',
  },
  
  // System
  system: {
    health: '/health',
    version: '/version',
    docs: '/docs',
  },
} as const;

// Type definitions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface WhatsAppInstance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  qrCode?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  instanceId: string;
  messageId: string;
  from: string;
  to: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'video' | 'document';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
}

// Export default
export default apiClient;
