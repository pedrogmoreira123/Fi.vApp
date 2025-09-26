import React, { createContext, useContext, ReactNode } from 'react';
import { useAuth, type UseAuthReturn } from '../hooks/useAuth';

// Create Auth Context
const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
}

// Auth Provider Component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use Auth Context
export const useAuthContext = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

// Export Auth Context
export { AuthContext };
