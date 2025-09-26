import React, { createContext, useContext, ReactNode } from 'react';
import { useWhatsApp, type UseWhatsAppReturn } from '../hooks/useWhatsApp';

// Create WhatsApp Context
const WhatsAppContext = createContext<UseWhatsAppReturn | undefined>(undefined);

// WhatsApp Provider Props
interface WhatsAppProviderProps {
  children: ReactNode;
}

// WhatsApp Provider Component
export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({ children }) => {
  const whatsapp = useWhatsApp();

  return (
    <WhatsAppContext.Provider value={whatsapp}>
      {children}
    </WhatsAppContext.Provider>
  );
};

// Custom hook to use WhatsApp Context
export const useWhatsAppContext = (): UseWhatsAppReturn => {
  const context = useContext(WhatsAppContext);
  
  if (context === undefined) {
    throw new Error('useWhatsAppContext must be used within a WhatsAppProvider');
  }
  
  return context;
};

// Export WhatsApp Context
export { WhatsAppContext };
