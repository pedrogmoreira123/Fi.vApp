import { useState, useEffect, useCallback } from 'react';
import { WhatsAppService, type WhatsAppInstance, type Message } from '../services/whatsapp.service';
import { websocketService } from '../services/websocket.service';

interface UseWhatsAppReturn {
  instances: WhatsAppInstance[];
  isLoading: boolean;
  error: string | null;
  createInstance: (name: string) => Promise<void>;
  connectInstance: (instanceId: string) => Promise<void>;
  disconnectInstance: (instanceId: string) => Promise<void>;
  deleteInstance: (instanceId: string) => Promise<void>;
  sendMessage: (instanceId: string, to: string, content: string, type?: string) => Promise<void>;
  getMessages: (instanceId: string, page?: number, limit?: number) => Promise<Message[]>;
  refreshInstances: () => Promise<void>;
}

export const useWhatsApp = (): UseWhatsAppReturn => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load instances on mount
  useEffect(() => {
    loadInstances();
  }, []);

  // Setup WebSocket listeners
  useEffect(() => {
    const handleWhatsAppEvent = (data: any) => {
      console.log('WhatsApp event received:', data);
      // Refresh instances when status changes
      loadInstances();
    };

    websocketService.on('whatsapp:connected', handleWhatsAppEvent);
    websocketService.on('whatsapp:disconnected', handleWhatsAppEvent);
    websocketService.on('whatsapp:status', handleWhatsAppEvent);

    return () => {
      websocketService.off('whatsapp:connected', handleWhatsAppEvent);
      websocketService.off('whatsapp:disconnected', handleWhatsAppEvent);
      websocketService.off('whatsapp:status', handleWhatsAppEvent);
    };
  }, []);

  // Load instances
  const loadInstances = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const instancesData = await WhatsAppService.getInstances();
      setInstances(instancesData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load instances';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create instance
  const createInstance = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const newInstance = await WhatsAppService.createInstance(name);
      setInstances(prev => [...prev, newInstance]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create instance';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect instance
  const connectInstance = useCallback(async (instanceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Join WebSocket room for this instance
      websocketService.joinInstance(instanceId);
      
      // Request QR code
      websocketService.requestQR(instanceId);
      
      // Connect via API
      await WhatsAppService.connectInstance(instanceId);
      
      // Update instance status
      const status = await WhatsAppService.getInstanceStatus(instanceId);
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId 
          ? { ...instance, status: status.status as any }
          : instance
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect instance';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect instance
  const disconnectInstance = useCallback(async (instanceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Leave WebSocket room
      websocketService.leaveInstance(instanceId);
      
      // Disconnect via API
      await WhatsAppService.disconnectInstance(instanceId);
      
      // Update instance status
      setInstances(prev => prev.map(instance => 
        instance.id === instanceId 
          ? { ...instance, status: 'disconnected' }
          : instance
      ));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect instance';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Delete instance
  const deleteInstance = useCallback(async (instanceId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Leave WebSocket room
      websocketService.leaveInstance(instanceId);
      
      // Delete via API
      await WhatsAppService.deleteInstance(instanceId);
      
      // Remove from local state
      setInstances(prev => prev.filter(instance => instance.id !== instanceId));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete instance';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (
    instanceId: string,
    to: string,
    content: string,
    type: string = 'text'
  ) => {
    try {
      setError(null);
      
      // Send via WebSocket for real-time delivery
      websocketService.sendMessage(instanceId, to, content, type);
      
      // Also send via API for persistence
      await WhatsAppService.sendMessage(instanceId, to, content, type as any);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Get messages
  const getMessages = useCallback(async (
    instanceId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Message[]> => {
    try {
      setError(null);
      const response = await WhatsAppService.getMessages(instanceId, page, limit);
      return response.messages;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load messages';
      setError(errorMessage);
      throw error;
    }
  }, []);

  // Refresh instances
  const refreshInstances = useCallback(async () => {
    await loadInstances();
  }, [loadInstances]);

  return {
    instances,
    isLoading,
    error,
    createInstance,
    connectInstance,
    disconnectInstance,
    deleteInstance,
    sendMessage,
    getMessages,
    refreshInstances,
  };
};
