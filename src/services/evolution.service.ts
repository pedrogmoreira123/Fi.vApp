import { logger } from '../config/logger';
import { env } from '../config/environment';

/**
 * Evolution API Service - Centralized service for WhatsApp integration
 * Handles all communication with Evolution API
 */
export class EvolutionService {
  private evolutionApiUrl: string;
  private evolutionApiKey: string;

  constructor() {
    this.evolutionApiUrl = env.EVOLUTION_API_URL || 'http://localhost:8080';
    this.evolutionApiKey = env.EVOLUTION_API_KEY || 'evolution-api-key-2024-secure';
    
    logger.info({
      evolutionApiUrl: this.evolutionApiUrl,
      evolutionApiKey: this.evolutionApiKey ? '***SET***' : 'NOT SET'
    }, 'Evolution API Service initialized');
  }

  /**
   * Make authenticated request to Evolution API
   */
  private async makeEvolutionRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const url = `${this.evolutionApiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.evolutionApiKey,
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      logger.debug({ url, method, hasData: !!data }, 'Making Evolution API request');
      
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      logger.debug({ endpoint, status: response.status }, 'Evolution API request successful');
      
      return result;
    } catch (error: any) {
      logger.error({ error: error.message, endpoint, method }, 'Evolution API request failed');
      throw new Error(`Evolution service error: ${error.message}`);
    }
  }

  /**
   * Create a new WhatsApp instance
   */
  async createInstance(tenantId: string, config?: {
    name?: string;
    integration?: string;
  }): Promise<{
    success: boolean;
    instanceName?: string;
    qrCode?: string;
    status?: string;
    message?: string;
  }> {
    try {
      logger.info({ tenantId }, 'Creating Evolution instance');
      
      const instanceName = tenantId;
      const integration = config?.integration || 'WHATSAPP-BAILEYS';
      
      // Check if instance already exists
      const existingInstance = await this.getInstance(tenantId);
      if (existingInstance.success) {
        return {
          success: true,
          instanceName,
          status: existingInstance.status,
          message: 'Instance already exists'
        };
      }

      // Create new instance
      const response = await this.makeEvolutionRequest('/instance/create', 'POST', {
        instanceName,
        qrcode: true,
        integration
      });

      return {
        success: true,
        instanceName,
        qrCode: response.base64,
        status: 'SCAN_QR_CODE',
        message: 'Instance created successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message, tenantId }, 'Error creating Evolution instance');
      return {
        success: false,
        message: error.message || 'Failed to create instance'
      };
    }
  }

  /**
   * Get instance information
   */
  async getInstance(tenantId: string): Promise<{
    success: boolean;
    status?: string;
    qrCode?: string;
    message?: string;
    data?: any;
  }> {
    try {
      const instanceName = tenantId;
      
      const response = await this.makeEvolutionRequest(`/instance/connectionState/${instanceName}`, 'GET');
      
      return {
        success: true,
        status: response.instance?.state || 'unknown',
        qrCode: response.instance?.qrcode?.base64,
        data: response.instance,
        message: 'Instance info retrieved successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message, tenantId }, 'Error getting Evolution instance info');
      return {
        success: false,
        message: error.message || 'Failed to get instance info'
      };
    }
  }

  /**
   * Get QR Code for instance
   */
  async getQRCode(tenantId: string): Promise<{
    success: boolean;
    qrCode?: string;
    status?: string;
    message?: string;
  }> {
    try {
      const instanceName = tenantId;
      
      const response = await this.makeEvolutionRequest(`/instance/connect/${instanceName}`, 'GET');
      
      return {
        success: true,
        qrCode: response.base64,
        status: 'SCAN_QR_CODE',
        message: 'QR Code retrieved successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message, tenantId }, 'Error getting Evolution QR code');
      return {
        success: false,
        message: error.message || 'Failed to get QR code'
      };
    }
  }

  /**
   * Get instance status
   */
  async getStatus(tenantId: string): Promise<{
    success: boolean;
    status?: string;
    message?: string;
  }> {
    try {
      const instanceInfo = await this.getInstance(tenantId);
      
      return {
        success: instanceInfo.success,
        status: instanceInfo.status,
        message: instanceInfo.message
      };

    } catch (error: any) {
      logger.error({ error: error.message, tenantId }, 'Error getting Evolution status');
      return {
        success: false,
        message: error.message || 'Failed to get status'
      };
    }
  }

  /**
   * Connect instance (generate QR code)
   */
  async connect(instanceId: string): Promise<{
    success: boolean;
    qrCode?: string;
    status?: string;
    message?: string;
  }> {
    try {
      const response = await this.makeEvolutionRequest(`/instance/connect/${instanceId}`, 'GET');
      
      return {
        success: true,
        qrCode: response.base64,
        status: 'SCAN_QR_CODE',
        message: 'QR Code generated successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message, instanceId }, 'Error connecting Evolution instance');
      return {
        success: false,
        message: error.message || 'Failed to connect instance'
      };
    }
  }

  /**
   * Disconnect instance
   */
  async disconnect(instanceId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      await this.makeEvolutionRequest(`/instance/delete/${instanceId}`, 'DELETE');
      
      return {
        success: true,
        message: 'Instance disconnected successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message, instanceId }, 'Error disconnecting Evolution instance');
      return {
        success: false,
        message: error.message || 'Failed to disconnect instance'
      };
    }
  }

  /**
   * Send text message
   */
  async sendMessage(instanceId: string, to: string, body: string, media?: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    caption?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    message?: string;
  }> {
    try {
      const formattedNumber = this.formatPhoneNumber(to);
      
      if (media) {
        // Send media message
        const messageData = {
          number: formattedNumber,
          [media.type]: {
            url: media.url,
            caption: media.caption
          }
        };

        const response = await this.makeEvolutionRequest(`/message/sendMedia/${instanceId}`, 'POST', messageData);
        
        return {
          success: true,
          messageId: response.key?.id,
          message: 'Media message sent successfully'
        };
      } else {
        // Send text message
        const response = await this.makeEvolutionRequest(`/message/sendText/${instanceId}`, 'POST', {
          number: formattedNumber,
          text: body
        });
        
        return {
          success: true,
          messageId: response.key?.id,
          message: 'Message sent successfully'
        };
      }

    } catch (error: any) {
      logger.error({ error: error.message, instanceId, to }, 'Error sending Evolution message');
      return {
        success: false,
        message: error.message || 'Failed to send message'
      };
    }
  }

  /**
   * Check Evolution API health
   */
  async health(): Promise<{
    success: boolean;
    status?: string;
    message?: string;
  }> {
    try {
      const response = await this.makeEvolutionRequest('/', 'GET');
      
      return {
        success: true,
        status: 'healthy',
        message: 'Evolution API service is healthy'
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Evolution API health check failed');
      return {
        success: false,
        message: error.message || 'Evolution API service is not available'
      };
    }
  }

  /**
   * Get all instances
   */
  async getAllInstances(): Promise<{
    success: boolean;
    instances?: any[];
    message?: string;
  }> {
    try {
      const response = await this.makeEvolutionRequest('/manager/fetchInstances', 'GET');
      
      return {
        success: true,
        instances: response.instances || [],
        message: 'Instances retrieved successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Error getting Evolution instances');
      return {
        success: false,
        message: error.message || 'Failed to get instances'
      };
    }
  }

  /**
   * Process webhook from Evolution API
   */
  async processWebhook(payload: any): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      logger.info({ payload }, 'Processing Evolution webhook');
      
      const { event, instance, data } = payload;
      
      if (event === 'messages.upsert') {
        // Handle incoming message
        await this.handleIncomingMessage(instance, data);
      } else if (event === 'connection.update') {
        // Handle connection update
        await this.handleConnectionUpdate(instance, data);
      }
      
      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error: any) {
      logger.error({ error: error.message, payload }, 'Error processing Evolution webhook');
      return {
        success: false,
        message: error.message || 'Failed to process webhook'
      };
    }
  }

  /**
   * Handle incoming message from webhook
   */
  private async handleIncomingMessage(instanceId: string, data: any): Promise<void> {
    try {
      const message = data.key;
      const messageData = data.message;
      
      if (messageData && messageData.conversation) {
        logger.info({
          instanceId,
          from: message.remoteJid,
          content: messageData.conversation
        }, 'Processing incoming message');
        
        // TODO: Implement message processing logic
        // This should integrate with the existing conversation system
      }
    } catch (error) {
      logger.error({ error: error.message, instanceId }, 'Error handling incoming message');
    }
  }

  /**
   * Handle connection update from webhook
   */
  private async handleConnectionUpdate(instanceId: string, data: any): Promise<void> {
    try {
      const { state } = data;
      
      logger.info({
        instanceId,
        state
      }, 'Processing connection update');
      
      // TODO: Implement connection update logic
      // This should update the instance status in the database
    } catch (error) {
      logger.error({ error: error.message, instanceId }, 'Error handling connection update');
    }
  }

  /**
   * Format phone number for WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remove non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If doesn't start with country code, add 55 (Brazil)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `55${cleaned}`;
    }
    
    // If already has country code, use as is
    if (cleaned.length >= 12) {
      return cleaned;
    }
    
    // If has 10 digits, add 55
    if (cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  }
}

// Export singleton instance
export const evolutionService = new EvolutionService();
