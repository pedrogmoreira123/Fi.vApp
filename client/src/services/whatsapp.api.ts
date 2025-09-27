import { apiClient } from './api';

// Types for WhatsApp API responses
export interface WhatsAppInstance {
  id: string;
  name: string;
  connectionStatus: string;
  status: string;
  qrCode?: string;
  phoneNumber?: string;
  profileName?: string;
  profilePicUrl?: string;
  lastUpdate?: string;
}

export interface QRCodeResponse {
  success: boolean;
  qrCode?: string;
  status?: string;
  message?: string;
}

export interface ConnectResponse {
  success: boolean;
  qrCode?: string;
  status?: string;
  message?: string;
}

export interface DisconnectResponse {
  success: boolean;
  message?: string;
}

export interface HealthResponse {
  success: boolean;
  status?: string;
  message?: string;
}

// WhatsApp API service functions
export async function getInstance(): Promise<{ success: boolean; data?: WhatsAppInstance; message?: string }> {
  return apiClient.get('/whatsapp/instance');
}

export async function getQRCode(instanceId: string): Promise<QRCodeResponse> {
  return apiClient.get(`/whatsapp/instance/${instanceId}/qrcode`);
}

export async function getStatus(instanceId: string): Promise<{ success: boolean; status?: string; message?: string }> {
  return apiClient.get(`/whatsapp/instance/${instanceId}/status`);
}

export async function connectInstance(instanceId: string): Promise<ConnectResponse> {
  return apiClient.post(`/whatsapp/instance/${instanceId}/connect`, {});
}

export async function disconnectInstance(instanceId: string): Promise<DisconnectResponse> {
  return apiClient.delete(`/whatsapp/instance/${instanceId}`);
}

export async function sendMessage(conversationId: string, data: {
  text: string;
  to: string;
  instanceId: string;
}): Promise<{ success: boolean; messageId?: string; message?: string }> {
  return apiClient.post(`/whatsapp/conversations/${conversationId}/send-message`, data);
}

export async function sendMedia(conversationId: string, data: {
  to: string;
  instanceId: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string;
  caption?: string;
}): Promise<{ success: boolean; messageId?: string; message?: string }> {
  return apiClient.post(`/whatsapp/conversations/${conversationId}/send-media`, data);
}

export async function getHealth(): Promise<HealthResponse> {
  return apiClient.get('/whatsapp/health');
}
