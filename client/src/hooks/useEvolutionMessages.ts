import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService } from '../services/websocket.service';
import { apiClient } from '../services/api';

export interface EvolutionMessage {
  id: string;
  conversationId: string;
  content: string;
  messageType: 'text' | 'image' | 'audio' | 'video' | 'document';
  direction: 'incoming' | 'outgoing';
  timestamp: string;
  isRead: boolean;
  mediaUrl?: string;
  externalId?: string;
}

export interface EvolutionConversation {
  id: string;
  contactName: string;
  contactPhone: string;
  status: 'waiting' | 'in_progress' | 'completed' | 'closed';
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
  whatsappConnectionId?: string;
}

interface UseEvolutionMessagesReturn {
  // Messages
  messages: EvolutionMessage[];
  isLoading: boolean;
  error: string | null;
  
  // Conversations
  conversations: EvolutionConversation[];
  activeConversation: EvolutionConversation | null;
  
  // Actions
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, messageType?: string) => Promise<void>;
  sendMediaMessage: (conversationId: string, media: { type: string; url: string; caption?: string }) => Promise<void>;
  markAsRead: (conversationId: string) => Promise<void>;
  
  // Conversation management
  loadConversations: () => Promise<void>;
  setActiveConversation: (conversation: EvolutionConversation | null) => void;
  refreshConversations: () => Promise<void>;
  
  // WebSocket status
  isConnected: boolean;
  reconnect: () => void;
}

export const useEvolutionMessages = (): UseEvolutionMessagesReturn => {
  const [messages, setMessages] = useState<EvolutionMessage[]>([]);
  const [conversations, setConversations] = useState<EvolutionConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<EvolutionConversation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  const messagesLoaded = useRef<Set<string>>(new Set());

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = () => {
      try {
        websocketService.connect();
        setIsConnected(websocketService.isConnected());
        
        // Setup event listeners
        websocketService.on('connect', () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setError(null);
        });

        websocketService.on('disconnect', () => {
          console.log('WebSocket disconnected');
          setIsConnected(false);
        });

        websocketService.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          setIsConnected(false);
          setError('WebSocket connection failed');
        });

        // WhatsApp specific events
        websocketService.on('whatsapp:message', (data) => {
          console.log('New WhatsApp message received:', data);
          handleNewMessage(data);
        });

        websocketService.on('whatsapp:status', (data) => {
          console.log('WhatsApp status update:', data);
          handleStatusUpdate(data);
        });

        websocketService.on('whatsapp:connected', (data) => {
          console.log('WhatsApp connected:', data);
          handleConnectionUpdate(data);
        });

        websocketService.on('whatsapp:disconnected', (data) => {
          console.log('WhatsApp disconnected:', data);
          handleConnectionUpdate(data);
        });

        websocketService.on('whatsapp:qr', (data) => {
          console.log('WhatsApp QR code received:', data);
          handleQRCode(data);
        });

      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        setError('Failed to initialize WebSocket connection');
      }
    };

    initializeWebSocket();

    return () => {
      websocketService.removeAllListeners();
    };
  }, []);

  // Handle new message from WebSocket
  const handleNewMessage = useCallback((data: any) => {
    try {
      const { conversationId, message } = data;
      
      if (message) {
        setMessages(prev => {
          // Check if message already exists
          const exists = prev.some(m => m.id === message.id || m.externalId === message.externalId);
          if (exists) return prev;
          
          return [...prev, message].sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
        });

        // Update conversation last message
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? {
                  ...conv,
                  lastMessage: message.content,
                  lastMessageAt: message.timestamp,
                  unreadCount: message.direction === 'incoming' ? conv.unreadCount + 1 : conv.unreadCount
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  }, []);

  // Handle status update
  const handleStatusUpdate = useCallback((data: any) => {
    console.log('Status update received:', data);
    // You can add status update logic here
  }, []);

  // Handle connection update
  const handleConnectionUpdate = useCallback((data: any) => {
    console.log('Connection update received:', data);
    // You can add connection update logic here
  }, []);

  // Handle QR code
  const handleQRCode = useCallback((data: any) => {
    console.log('QR code received:', data);
    // You can add QR code handling logic here
  }, []);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if messages already loaded
      if (messagesLoaded.current.has(conversationId)) {
        return;
      }

      const response = await apiClient.get<{ data: EvolutionMessage[] }>(
        `/conversations/${conversationId}/messages`
      );

      setMessages(response.data);
      messagesLoaded.current.add(conversationId);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send message
  const sendMessage = useCallback(async (
    conversationId: string, 
    content: string, 
    messageType: string = 'text'
  ) => {
    try {
      setError(null);

      const response = await apiClient.post<{ data: EvolutionMessage }>(
        `/conversations/${conversationId}/send-message`,
        {
          text: content,
          to: activeConversation?.contactPhone
        }
      );

      // Add message to local state
      setMessages(prev => [...prev, response.data]);

      // Update conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                lastMessage: content,
                lastMessageAt: response.data.timestamp
              }
            : conv
        )
      );

    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      throw error;
    }
  }, [activeConversation]);

  // Send media message
  const sendMediaMessage = useCallback(async (
    conversationId: string,
    media: { type: string; url: string; caption?: string }
  ) => {
    try {
      setError(null);

      const response = await apiClient.post<{ data: EvolutionMessage }>(
        `/conversations/${conversationId}/send-media`,
        {
          to: activeConversation?.contactPhone,
          type: media.type,
          url: media.url,
          caption: media.caption
        }
      );

      // Add message to local state
      setMessages(prev => [...prev, response.data]);

      // Update conversation
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? {
                ...conv,
                lastMessage: media.caption || `[${media.type.toUpperCase()}]`,
                lastMessageAt: response.data.timestamp
              }
            : conv
        )
      );

    } catch (error) {
      console.error('Failed to send media message:', error);
      setError('Failed to send media message');
      throw error;
    }
  }, [activeConversation]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: string) => {
    try {
      await apiClient.patch(`/conversations/${conversationId}/read`, {});
      
      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );

      setMessages(prev => 
        prev.map(msg => 
          msg.conversationId === conversationId 
            ? { ...msg, isRead: true }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiClient.get<{ data: EvolutionConversation[] }>(
        '/conversations'
      );

      setConversations(response.data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    await loadConversations();
  }, [loadConversations]);

  // Reconnect WebSocket
  const reconnect = useCallback(() => {
    try {
      websocketService.disconnect();
      setTimeout(() => {
        websocketService.connect();
      }, 1000);
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation, loadMessages]);

  return {
    messages,
    conversations,
    activeConversation,
    isLoading,
    error,
    loadMessages,
    sendMessage,
    sendMediaMessage,
    markAsRead,
    loadConversations,
    setActiveConversation,
    refreshConversations,
    isConnected,
    reconnect,
  };
};
