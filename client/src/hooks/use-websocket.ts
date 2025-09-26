import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: number;
}

interface WebSocketHook {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (callback: (message: WebSocketMessage) => void) => () => void;
}

export function useWebSocket(url?: string): WebSocketHook {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const callbacks = useRef<((message: WebSocketMessage) => void)[]>([]);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        console.warn('⚠️  No auth token found, WebSocket connection skipped');
        return;
      }

      const wsUrl = url || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws?token=${token}`;
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;
        
        // Send ping to keep connection alive
        sendMessage({ type: 'ping' });
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Notify all subscribers
          callbacks.current.forEach(callback => {
            try {
              callback(message);
            } catch (error) {
              console.error('❌ WebSocket callback error:', error);
            }
          });

          // Handle specific message types
          switch (message.type) {
            case 'pong':
              // Connection is alive
              break;
            case 'new_conversation':
              console.log('📨 New conversation:', message.data);
              break;
            case 'new_message':
              console.log('💬 New message:', message.data);
              break;
            case 'conversation_status_change':
              console.log('🔄 Conversation status changed:', message.data);
              break;
            case 'user_status_change':
              console.log('👤 User status changed:', message.data);
              break;
            case 'whatsapp_status':
              console.log('📱 WhatsApp status changed:', message.data);
              break;
            case 'system_message':
              console.log('🔔 System message:', message.data);
              break;
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      ws.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setIsConnected(false);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
    }
  };

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    
    setIsConnected(false);
  };

  const sendMessage = (message: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️  WebSocket not connected, message not sent:', message);
    }
  };

  const subscribe = (callback: (message: WebSocketMessage) => void) => {
    callbacks.current.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = callbacks.current.indexOf(callback);
      if (index > -1) {
        callbacks.current.splice(index, 1);
      }
    };
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  // Keep connection alive with periodic pings
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => {
      clearInterval(pingInterval);
    };
  }, [isConnected]);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    subscribe
  };
}
