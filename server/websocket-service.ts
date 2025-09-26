import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { storage } from './storage';

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();
  private userSockets: Map<string, string> = new Map(); // userId -> socketId

  constructor() {
    console.log('🔌 WebSocket Service initialized');
  }

  /**
   * Initialize WebSocket server
   */
  initialize(server: any) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('🔌 New WebSocket connection');
      
      // Handle authentication
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify token and get user
      this.authenticateUser(token)
        .then(user => {
          if (!user) {
            ws.close(1008, 'Invalid token');
            return;
          }

          const socketId = this.generateSocketId();
          this.clients.set(socketId, ws);
          this.userSockets.set(user.id, socketId);

          console.log(`✅ User ${user.name} connected via WebSocket`);

          // Send welcome message
          this.sendToSocket(socketId, {
            type: 'connected',
            message: 'Connected to real-time updates',
            user: {
              id: user.id,
              name: user.name,
              role: user.role
            }
          });

          // Handle messages from client
          ws.on('message', (data) => {
            try {
              const message = JSON.parse(data.toString());
              this.handleClientMessage(socketId, message);
            } catch (error) {
              console.error('❌ Error parsing WebSocket message:', error);
            }
          });

          // Handle disconnect
          ws.on('close', () => {
            console.log(`🔌 User ${user.name} disconnected`);
            this.clients.delete(socketId);
            this.userSockets.delete(user.id);
          });

          // Handle errors
          ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            this.clients.delete(socketId);
            this.userSockets.delete(user.id);
          });

        })
        .catch(error => {
          console.error('❌ Authentication error:', error);
          ws.close(1008, 'Authentication failed');
        });
    });

    console.log('✅ WebSocket server initialized');
  }

  /**
   * Authenticate user from token
   */
  private async authenticateUser(token: string): Promise<any> {
    try {
      // This would normally verify the JWT token
      // For now, we'll use a simple approach
      const users = await storage.getAllUsers();
      const user = users.find(u => u.id === token); // Simplified for demo
      return user;
    } catch (error) {
      console.error('❌ Authentication error:', error);
      return null;
    }
  }

  /**
   * Generate unique socket ID
   */
  private generateSocketId(): string {
    return `socket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Handle messages from client
   */
  private handleClientMessage(socketId: string, message: any) {
    const ws = this.clients.get(socketId);
    if (!ws) return;

    switch (message.type) {
      case 'ping':
        this.sendToSocket(socketId, { type: 'pong', timestamp: Date.now() });
        break;
      
      case 'subscribe':
        // Handle subscription to specific events
        console.log(`📡 User subscribed to: ${message.events?.join(', ')}`);
        break;
      
      default:
        console.log('📨 Unknown message type:', message.type);
    }
  }

  /**
   * Send message to specific socket
   */
  private sendToSocket(socketId: string, data: any) {
    const ws = this.clients.get(socketId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Send message to specific user
   */
  sendToUser(userId: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.sendToSocket(socketId, data);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(data: any) {
    this.clients.forEach((ws, socketId) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  /**
   * Broadcast to users with specific role
   */
  broadcastToRole(role: string, data: any) {
    // This would require maintaining a role-to-socket mapping
    // For now, we'll broadcast to all
    this.broadcast(data);
  }

  /**
   * Notify new conversation
   */
  notifyNewConversation(conversation: any) {
    this.broadcast({
      type: 'new_conversation',
      data: conversation,
      timestamp: Date.now()
    });
  }

  /**
   * Notify new message
   */
  notifyNewMessage(conversationId: string, message: any) {
    this.broadcast({
      type: 'new_message',
      data: {
        conversationId,
        message
      },
      timestamp: Date.now()
    });
  }

  /**
   * Notify conversation status change
   */
  notifyConversationStatusChange(conversationId: string, status: string, agentId?: string) {
    this.broadcast({
      type: 'conversation_status_change',
      data: {
        conversationId,
        status,
        agentId
      },
      timestamp: Date.now()
    });
  }

  /**
   * Notify user status change
   */
  notifyUserStatusChange(userId: string, isOnline: boolean) {
    this.broadcast({
      type: 'user_status_change',
      data: {
        userId,
        isOnline
      },
      timestamp: Date.now()
    });
  }

  /**
   * Notify WhatsApp connection status
   */
  notifyWhatsAppStatus(connectionId: string, status: string, qrCode?: string) {
    this.broadcast({
      type: 'whatsapp_status',
      data: {
        connectionId,
        status,
        qrCode
      },
      timestamp: Date.now()
    });
  }

  /**
   * Notify system message
   */
  notifySystemMessage(message: string, type: 'info' | 'warning' | 'error' = 'info') {
    this.broadcast({
      type: 'system_message',
      data: {
        message,
        type
      },
      timestamp: Date.now()
    });
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.clients.size;
  }

  /**
   * Get connected users
   */
  getConnectedUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
