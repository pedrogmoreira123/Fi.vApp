import { io, Socket } from 'socket.io-client';
import { env } from '../../env';

export class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Initialize WebSocket connection
  connect(): void {
    if (this.socket?.connected) {
      return;
    }

    const wsUrl = env.VITE_WS_URL || 'http://localhost:3000';
    
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventListeners();
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnection();
    });

    // WhatsApp events
    this.socket.on('whatsapp:qr', (data) => {
      this.emit('whatsapp:qr', data);
    });

    this.socket.on('whatsapp:connected', (data) => {
      this.emit('whatsapp:connected', data);
    });

    this.socket.on('whatsapp:disconnected', (data) => {
      this.emit('whatsapp:disconnected', data);
    });

    this.socket.on('whatsapp:message', (data) => {
      this.emit('whatsapp:message', data);
    });

    this.socket.on('whatsapp:status', (data) => {
      this.emit('whatsapp:status', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  // Handle reconnection logic
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  // Join WhatsApp instance room
  joinInstance(instanceId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('whatsapp:join', { instanceId });
    }
  }

  // Leave WhatsApp instance room
  leaveInstance(instanceId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('whatsapp:leave', { instanceId });
    }
  }

  // Send WhatsApp message
  sendMessage(instanceId: string, to: string, content: string, type: string = 'text'): void {
    if (this.socket?.connected) {
      this.socket.emit('whatsapp:send', {
        instanceId,
        to,
        content,
        type,
      });
    }
  }

  // Request QR code
  requestQR(instanceId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('whatsapp:requestQR', { instanceId });
    }
  }

  // Disconnect WebSocket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Event emitter functionality
  private listeners: Map<string, Function[]> = new Map();

  // Add event listener
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // Remove event listener
  off(event: string, callback: Function): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
      }
    }
  }

  // Emit event
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Remove all listeners
  removeAllListeners(): void {
    this.listeners.clear();
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();
