import { createServer, type Server } from "http";
import { storage } from "./storage";

export class WahaService {
  private wahaApiUrl: string;
  private wahaApiKey: string;

  constructor() {
    this.wahaApiUrl = process.env.WAHA_API_URL || 'http://localhost:3001';
    this.wahaApiKey = process.env.WAHA_API_KEY || 'waha-api-key-2024-secure';
    
    console.log('🔧 WAHA Service Configuration:');
    console.log('WAHA_API_URL:', this.wahaApiUrl);
    console.log('WAHA_API_KEY:', this.wahaApiKey ? '***SET***' : 'NOT SET');
  }

  /**
   * Fazer requisição para a API do WAHA
   */
  private async makeWahaRequest(endpoint: string, method: string = 'GET', data?: any): Promise<any> {
    const url = `${this.wahaApiUrl}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.wahaApiKey,
      },
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`WAHA API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('WAHA API request failed:', error);
      throw new Error(`WAHA service error: ${error.message}`);
    }
  }

  /**
   * Iniciar uma nova sessão WhatsApp
   * NOTA: Versão gratuita do WAHA só suporta sessão 'default'
   * Para multi-tenancy real, é necessário WAHA PLUS
   */
  async startSession(tenantId: string, name?: string): Promise<{
    success: boolean;
    sessionId?: string;
    qrCode?: string;
    status?: string;
    message?: string;
  }> {
    try {
      // Versão gratuita do WAHA só suporta sessão 'default'
      // Vamos usar uma abordagem híbrida: sessão única com controle por tenant no Redis
      const sessionName = 'default';
      
      // Verificar se já existe uma sessão ativa para outro tenant
      const existingSession = await this.getSessionStatus('default');
      
      if (existingSession.success) {
        // Verificar se a sessão pertence ao tenant atual
        const sessionInfo = await storage.getWahaSession(tenantId);
        
        if (sessionInfo && sessionInfo.tenantId === tenantId) {
          // Sessão pertence ao tenant atual
          if (existingSession.status === 'CONNECTED' || existingSession.status === 'WORKING') {
            return {
              success: true,
              sessionId: 'default',
              status: existingSession.status,
              message: 'Session already connected'
            };
          }
          
          if (existingSession.status === 'SCAN_QR_CODE') {
            return {
              success: true,
              sessionId: 'default',
              status: 'SCAN_QR_CODE',
              message: 'Please scan the QR code to connect'
            };
          }
        } else if (sessionInfo && sessionInfo.tenantId !== tenantId) {
          // Sessão pertence a outro tenant - não permitir
          return {
            success: false,
            message: 'WhatsApp is currently connected by another company. Please wait for them to disconnect first.'
          };
        }
      }

      // Iniciar sessão default
      const response = await this.makeWahaRequest('/api/sessions/default/start', 'POST');
      
      // Salvar informações da sessão no Redis com tenantId
      await storage.saveWahaSession({
        tenantId,
        sessionId: 'default',
        status: 'STARTING',
        qrCode: response.qrCode,
        lastActivity: new Date()
      });

      return {
        success: true,
        sessionId: 'default',
        qrCode: response.qrCode,
        status: response.status || 'STARTING',
        message: response.qrCode ? 'Please scan the QR code to connect' : 'Session started successfully'
      };

    } catch (error: any) {
      console.error('Error starting WAHA session:', error);
      
      // Se o erro é que a sessão já está iniciada, verificar o status
      if (error.message && error.message.includes('already started')) {
        const sessionStatus = await this.getSessionStatus('default');
        if (sessionStatus.success) {
          // Verificar se a sessão pertence ao tenant atual
          const sessionInfo = await storage.getWahaSession(tenantId);
          if (sessionInfo && sessionInfo.tenantId === tenantId) {
            return {
              success: true,
              sessionId: 'default',
              status: sessionStatus.status,
              message: sessionStatus.status === 'SCAN_QR_CODE' ? 'Please scan the QR code to connect' : 'Session already active'
            };
          } else {
            return {
              success: false,
              message: 'WhatsApp is currently connected by another company. Please wait for them to disconnect first.'
            };
          }
        }
      }
      
      return {
        success: false,
        message: error.message || 'Failed to start WhatsApp session'
      };
    }
  }

  /**
   * Obter status da sessão
   */
  async getSessionStatus(tenantId: string): Promise<{
    success: boolean;
    status?: string;
    qrCode?: string;
    message?: string;
  }> {
    try {
      // Versão gratuita só suporta sessão 'default'
      const response = await this.makeWahaRequest('/api/sessions/default');
      
      return {
        success: true,
        status: response.status,
        qrCode: response.qrCode,
        message: response.message
      };

    } catch (error: any) {
      console.error('Error getting WAHA session status:', error);
      return {
        success: false,
        message: error.message || 'Failed to get session status'
      };
    }
  }

  /**
   * Desconectar sessão
   */
  async disconnectSession(tenantId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      // Verificar se a sessão pertence ao tenant atual
      const sessionInfo = await storage.getWahaSession(tenantId);
      
      if (!sessionInfo || sessionInfo.tenantId !== tenantId) {
        return {
          success: false,
          message: 'No active session found for this company'
        };
      }

      // Parar sessão default
      await this.makeWahaRequest('/api/sessions/default/stop', 'POST');
      
      // Remover sessão do Redis
      await storage.removeWahaSession(tenantId);
      
      return {
        success: true,
        message: 'Session disconnected successfully'
      };

    } catch (error: any) {
      console.error('Error disconnecting WAHA session:', error);
      
      // Se a sessão não existe, considerar como sucesso
      if (error.message && error.message.includes('not found')) {
        await storage.removeWahaSession(tenantId);
        return {
          success: true,
          message: 'Session was already disconnected'
        };
      }
      
      return {
        success: false,
        message: error.message || 'Failed to disconnect session'
      };
    }
  }

  /**
   * Enviar mensagem de texto
   */
  async sendTextMessage(tenantId: string, to: string, text: string): Promise<{
    success: boolean;
    messageId?: string;
    message?: string;
  }> {
    try {
      const messageData = {
        to,
        text,
        session: tenantId
      };

      const response = await this.makeWahaRequest('/api/sendText', 'POST', messageData);
      
      return {
        success: true,
        messageId: response.messageId,
        message: 'Message sent successfully'
      };

    } catch (error: any) {
      console.error('Error sending WAHA message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message'
      };
    }
  }

  /**
   * Enviar mensagem de mídia
   */
  async sendMediaMessage(tenantId: string, to: string, media: {
    type: 'image' | 'video' | 'audio' | 'document';
    url: string;
    caption?: string;
  }): Promise<{
    success: boolean;
    messageId?: string;
    message?: string;
  }> {
    try {
      const messageData = {
        to,
        session: tenantId,
        [media.type]: {
          url: media.url,
          caption: media.caption
        }
      };

      const response = await this.makeWahaRequest(`/api/send${media.type.charAt(0).toUpperCase() + media.type.slice(1)}`, 'POST', messageData);
      
      return {
        success: true,
        messageId: response.messageId,
        message: 'Media message sent successfully'
      };

    } catch (error: any) {
      console.error('Error sending WAHA media message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send media message'
      };
    }
  }

  /**
   * Obter informações da sessão
   */
  async getSessionInfo(tenantId: string): Promise<{
    success: boolean;
    info?: any;
    message?: string;
  }> {
    try {
      // Versão gratuita só suporta sessão 'default'
      const response = await this.makeWahaRequest('/api/sessions/default');
      
      return {
        success: true,
        info: response,
        message: 'Session info retrieved successfully'
      };

    } catch (error: any) {
      console.error('Error getting WAHA session info:', error);
      return {
        success: false,
        message: error.message || 'Failed to get session info'
      };
    }
  }

  /**
   * Listar todas as sessões
   */
  async getAllSessions(): Promise<{
    success: boolean;
    sessions?: any[];
    message?: string;
  }> {
    try {
      const response = await this.makeWahaRequest('/api/sessions');
      
      return {
        success: true,
        sessions: response.sessions || [],
        message: 'Sessions retrieved successfully'
      };

    } catch (error: any) {
      console.error('Error getting WAHA sessions:', error);
      return {
        success: false,
        message: error.message || 'Failed to get sessions'
      };
    }
  }

  /**
   * Verificar saúde do serviço WAHA
   */
  async checkHealth(): Promise<{
    success: boolean;
    status?: string;
    message?: string;
  }> {
    try {
      // Usar rota que funciona na versão gratuita
      const response = await this.makeWahaRequest('/api/sessions');
      
      return {
        success: true,
        status: 'healthy',
        message: 'WAHA service is healthy'
      };

    } catch (error: any) {
      console.error('WAHA health check failed:', error);
      return {
        success: false,
        message: error.message || 'WAHA service is not available'
      };
    }
  }
}

// Instância singleton do serviço WAHA
export const wahaService = new WahaService();
