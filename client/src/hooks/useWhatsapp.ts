import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '../services/websocket.service';
import { 
  getInstance, 
  getQRCode, 
  connectInstance, 
  disconnectInstance,
  getStatus,
  type WhatsAppInstance,
  type QRCodeResponse,
  type ConnectResponse,
  type DisconnectResponse
} from '../services/whatsapp.api';

export interface UseWhatsappReturn {
  instance: WhatsAppInstance | null;
  qrcode: string | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: (instanceId: string) => Promise<void>;
  disconnect: (instanceId: string) => Promise<void>;
  refreshInstance: () => Promise<void>;
  refreshQRCode: (instanceId: string) => Promise<void>;
}

export function useWhatsapp(): UseWhatsappReturn {
  const [instance, setInstance] = useState<WhatsAppInstance | null>(null);
  const [qrcode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed states
  const isConnected = instance?.connectionStatus === 'open' || instance?.connectionStatus === 'connected';
  const isConnecting = instance?.connectionStatus === 'connecting';

  // Initialize WebSocket connection
  useEffect(() => {
    websocketService.connect();
    
    return () => {
      websocketService.disconnect();
    };
  }, []);

  // Setup WebSocket event listeners
  useEffect(() => {
    const handleStatusUpdate = (data: any) => {
      console.log('WhatsApp status update:', data);
      if (data.instance) {
        setInstance(data.instance);
      }
    };

    const handleQRCode = (data: any) => {
      console.log('WhatsApp QR code received:', data);
      if (data.qrCode) {
        setQrCode(data.qrCode);
      }
    };

    const handleConnected = (data: any) => {
      console.log('WhatsApp connected:', data);
      setQrCode(null); // Clear QR code when connected
      if (data.instance) {
        setInstance(data.instance);
      }
    };

    const handleDisconnected = (data: any) => {
      console.log('WhatsApp disconnected:', data);
      if (data.instance) {
        setInstance(data.instance);
      }
    };

    const handleError = (error: any) => {
      console.error('WhatsApp WebSocket error:', error);
      setError(error.message || 'WebSocket connection error');
    };

    // Register event listeners
    websocketService.on('whatsapp:status', handleStatusUpdate);
    websocketService.on('whatsapp:qr', handleQRCode);
    websocketService.on('whatsapp:connected', handleConnected);
    websocketService.on('whatsapp:disconnected', handleDisconnected);
    websocketService.on('error', handleError);

    // Cleanup listeners on unmount
    return () => {
      websocketService.off('whatsapp:status', handleStatusUpdate);
      websocketService.off('whatsapp:qr', handleQRCode);
      websocketService.off('whatsapp:connected', handleConnected);
      websocketService.off('whatsapp:disconnected', handleDisconnected);
      websocketService.off('error', handleError);
    };
  }, []);

  // Fetch initial instance data
  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await getInstance();
        
        if (response.success && response.data) {
          setInstance(response.data);
          
          // Join the instance room for real-time updates
          websocketService.joinInstance(response.data.id);
        } else {
          setError(response.message || 'Failed to fetch instance');
        }
      } catch (err: any) {
        console.error('Error fetching instance:', err);
        setError(err.message || 'Failed to fetch instance');
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Connect instance
  const connect = useCallback(async (instanceId: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response: ConnectResponse = await connectInstance(instanceId);
      
      if (response.success) {
        if (response.qrCode) {
          setQrCode(response.qrCode);
        }
        if (response.status) {
          setInstance(prev => prev ? { ...prev, connectionStatus: response.status! } : null);
        }
      } else {
        setError(response.message || 'Failed to connect instance');
      }
    } catch (err: any) {
      console.error('Error connecting instance:', err);
      setError(err.message || 'Failed to connect instance');
    } finally {
      setLoading(false);
    }
  }, []);

  // Disconnect instance
  const disconnect = useCallback(async (instanceId: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response: DisconnectResponse = await disconnectInstance(instanceId);
      
      if (response.success) {
        setInstance(prev => prev ? { ...prev, connectionStatus: 'disconnected' } : null);
        setQrCode(null);
        
        // Leave the instance room
        websocketService.leaveInstance(instanceId);
      } else {
        setError(response.message || 'Failed to disconnect instance');
      }
    } catch (err: any) {
      console.error('Error disconnecting instance:', err);
      setError(err.message || 'Failed to disconnect instance');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh instance data
  const refreshInstance = useCallback(async () => {
    try {
      setError(null);
      
      const response = await getInstance();
      
      if (response.success && response.data) {
        setInstance(response.data);
      } else {
        setError(response.message || 'Failed to refresh instance');
      }
    } catch (err: any) {
      console.error('Error refreshing instance:', err);
      setError(err.message || 'Failed to refresh instance');
    }
  }, []);

  // Refresh QR code
  const refreshQRCode = useCallback(async (instanceId: string) => {
    try {
      setError(null);
      
      const response: QRCodeResponse = await getQRCode(instanceId);
      
      if (response.success && response.qrCode) {
        setQrCode(response.qrCode);
      } else {
        setError(response.message || 'Failed to get QR code');
      }
    } catch (err: any) {
      console.error('Error getting QR code:', err);
      setError(err.message || 'Failed to get QR code');
    }
  }, []);

  return {
    instance,
    qrcode,
    loading,
    error,
    isConnected,
    isConnecting,
    connect,
    disconnect,
    refreshInstance,
    refreshQRCode,
  };
}
