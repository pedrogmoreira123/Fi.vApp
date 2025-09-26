// Environment configuration for client
export const env = {
  // API Configuration
  VITE_API_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  VITE_WS_URL: import.meta.env.VITE_WS_URL || 'http://localhost:3000',
  
  // App Configuration
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'Fi.V App',
  VITE_APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  VITE_APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'WhatsApp Integration Platform',
  
  // Environment
  NODE_ENV: import.meta.env.NODE_ENV || 'development',
  MODE: import.meta.env.MODE || 'development',
  
  // Features
  VITE_ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  VITE_ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  
  // External Services
  VITE_GOOGLE_ANALYTICS_ID: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  
  // File Upload
  VITE_MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
  VITE_ALLOWED_FILE_TYPES: import.meta.env.VITE_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'application/pdf',
    'text/plain'
  ],
  
  // WebSocket Configuration
  VITE_WS_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WS_RECONNECT_ATTEMPTS || '5'),
  VITE_WS_RECONNECT_DELAY: parseInt(import.meta.env.VITE_WS_RECONNECT_DELAY || '1000'),
  
  // UI Configuration
  VITE_THEME: import.meta.env.VITE_THEME || 'light',
  VITE_LANGUAGE: import.meta.env.VITE_LANGUAGE || 'pt-BR',
  
  // Development
  VITE_DEV_TOOLS: import.meta.env.VITE_DEV_TOOLS === 'true',
  VITE_MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
} as const;

// Type for environment variables
export type Environment = typeof env;

// Helper functions
export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';

// Validate required environment variables
export const validateEnv = (): void => {
  const required = [
    'VITE_API_URL',
  ];
  
  const missing = required.filter(key => !env[key as keyof typeof env]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

// Initialize environment validation
if (typeof window !== 'undefined') {
  try {
    validateEnv();
  } catch (error) {
    console.error('Environment validation failed:', error);
  }
}
