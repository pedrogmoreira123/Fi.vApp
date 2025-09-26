import { apiClient, endpoints, type WhatsAppInstance, type Message } from './api';

export class WhatsAppService {
  // Get all instances
  static async getInstances(): Promise<WhatsAppInstance[]> {
    const response = await apiClient.get<{ data: WhatsAppInstance[] }>(endpoints.whatsapp.instances);
    return response.data;
  }

  // Create new instance
  static async createInstance(name: string): Promise<WhatsAppInstance> {
    const response = await apiClient.post<{ data: WhatsAppInstance }>(endpoints.whatsapp.instances, {
      name,
    });
    return response.data;
  }

  // Connect instance
  static async connectInstance(instanceId: string): Promise<{ qrCode?: string; status: string }> {
    const response = await apiClient.post<{ data: { qrCode?: string; status: string } }>(
      `${endpoints.whatsapp.connect}/${instanceId}`,
      {}
    );
    return response.data;
  }

  // Disconnect instance
  static async disconnectInstance(instanceId: string): Promise<void> {
    await apiClient.post(`${endpoints.whatsapp.disconnect}/${instanceId}`, {});
  }

  // Get instance status
  static async getInstanceStatus(instanceId: string): Promise<{ status: string; phoneNumber?: string }> {
    const response = await apiClient.get<{ data: { status: string; phoneNumber?: string } }>(
      `${endpoints.whatsapp.status}/${instanceId}`
    );
    return response.data;
  }

  // Send message
  static async sendMessage(
    instanceId: string,
    to: string,
    content: string,
    type: 'text' | 'image' | 'audio' | 'video' | 'document' = 'text',
    mediaUrl?: string
  ): Promise<{ messageId: string; status: string }> {
    const response = await apiClient.post<{ data: { messageId: string; status: string } }>(
      `${endpoints.whatsapp.send}/${instanceId}`,
      {
        to,
        content,
        type,
        mediaUrl,
      }
    );
    return response.data;
  }

  // Get messages
  static async getMessages(
    instanceId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ messages: Message[]; pagination: any }> {
    const response = await apiClient.get<{ data: { messages: Message[]; pagination: any } }>(
      `${endpoints.whatsapp.messages}/${instanceId}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  // Get message by ID
  static async getMessage(instanceId: string, messageId: string): Promise<Message> {
    const response = await apiClient.get<{ data: Message }>(
      `${endpoints.whatsapp.messages}/${instanceId}/${messageId}`
    );
    return response.data;
  }

  // Delete instance
  static async deleteInstance(instanceId: string): Promise<void> {
    await apiClient.delete(`${endpoints.whatsapp.instances}/${instanceId}`);
  }

  // Update instance
  static async updateInstance(instanceId: string, data: Partial<WhatsAppInstance>): Promise<WhatsAppInstance> {
    const response = await apiClient.put<{ data: WhatsAppInstance }>(
      `${endpoints.whatsapp.instances}/${instanceId}`,
      data
    );
    return response.data;
  }

  // Get instance statistics
  static async getInstanceStats(instanceId: string): Promise<{
    totalMessages: number;
    sentMessages: number;
    receivedMessages: number;
    failedMessages: number;
    lastActivity: string;
  }> {
    const response = await apiClient.get<{ data: any }>(`${endpoints.whatsapp.instances}/${instanceId}/stats`);
    return response.data;
  }

  // Mark message as read
  static async markAsRead(instanceId: string, messageId: string): Promise<void> {
    await apiClient.patch(`${endpoints.whatsapp.messages}/${instanceId}/${messageId}/read`, {});
  }

  // Get webhook configuration
  static async getWebhookConfig(instanceId: string): Promise<{
    url: string;
    events: string[];
    active: boolean;
  }> {
    const response = await apiClient.get<{ data: any }>(`${endpoints.whatsapp.instances}/${instanceId}/webhook`);
    return response.data;
  }

  // Update webhook configuration
  static async updateWebhookConfig(
    instanceId: string,
    config: { url: string; events: string[]; active: boolean }
  ): Promise<void> {
    await apiClient.put(`${endpoints.whatsapp.instances}/${instanceId}/webhook`, config);
  }
}
