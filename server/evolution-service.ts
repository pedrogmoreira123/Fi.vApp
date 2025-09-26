import { storage } from './storage';
import type { WhatsappConnection } from '@shared/schema';

export class EvolutionService {
  private evolutionApiUrl: string;
  private evolutionApiKey: string;

  constructor() {
    this.evolutionApiUrl = process.env.EVOLUTION_API_URL || 'http://localhost:8081';
    this.evolutionApiKey = process.env.EVOLUTION_API_KEY || 'evolution-api-key-2024-secure';
    
    console.log('🔧 Evolution API Service Configuration:');
    console.log('EVOLUTION_API_URL:', this.evolutionApiUrl);
    console.log('EVOLUTION_API_KEY:', this.evolutionApiKey ? '***SET***' : 'NOT SET');
  }

  /**
   * Fazer requisição para a Evolution API
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
      const response = await fetch(url, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Evolution API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      console.error('Evolution API request failed:', error);
      throw new Error(`Evolution service error: ${error.message}`);
    }
  }

  /**
   * Criar uma nova instância (conexão WhatsApp)
   */
  async createInstance(tenantId: string, name: string): Promise<{
    success: boolean;
    instanceName?: string;
    qrCode?: string;
    status?: string;
    message?: string;
  }> {
    try {
      console.log(`🔄 Creating Evolution instance for tenant: ${tenantId}`);
      
      // Usar tenantId como instanceName para isolamento
      const instanceName = tenantId;
      
      // Verificar se a instância já existe
      const existingInstance = await this.getInstanceInfo(instanceName);
      if (existingInstance.success) {
        return {
          success: true,
          instanceName,
          status: existingInstance.status,
          message: 'Instance already exists'
        };
      }

      // Criar nova instância
      const response = await this.makeEvolutionRequest('/instance/create', 'POST', {
        instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      });

      // Salvar conexão no banco de dados
      const connection = await storage.createWhatsAppConnection({
        name,
        isDefault: false,
        status: 'connecting',
        phone: null,
        qrCode: response.base64
      });

      // Atualizar com o ID da instância
      await storage.updateWhatsAppConnection(connection.id, {
        phone: instanceName // Usar instanceName como identificador
      });

      return {
        success: true,
        instanceName,
        qrCode: response.base64,
        status: 'SCAN_QR_CODE',
        message: 'Instance created successfully'
      };

    } catch (error: any) {
      console.error('Error creating Evolution instance:', error);
      return {
        success: false,
        message: error.message || 'Failed to create instance'
      };
    }
  }

  /**
   * Conectar instância (gerar QR Code)
   */
  async connectInstance(tenantId: string): Promise<{
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
        status: response.status || 'SCAN_QR_CODE',
        message: 'QR Code generated successfully'
      };

    } catch (error: any) {
      console.error('Error connecting Evolution instance:', error);
      return {
        success: false,
        message: error.message || 'Failed to connect instance'
      };
    }
  }

  /**
   * Obter informações da instância
   */
  async getInstanceInfo(tenantId: string): Promise<{
    success: boolean;
    status?: string;
    qrCode?: string;
    message?: string;
  }> {
    try {
      const instanceName = tenantId;
      
      const response = await this.makeEvolutionRequest(`/instance/connectionState/${instanceName}`, 'GET');
      
      return {
        success: true,
        status: response.instance.connectionState,
        qrCode: response.instance.qrcode?.base64,
        message: 'Instance info retrieved successfully'
      };

    } catch (error: any) {
      console.error('Error getting Evolution instance info:', error);
      return {
        success: false,
        message: error.message || 'Failed to get instance info'
      };
    }
  }

  /**
   * Desconectar instância
   */
  async disconnectInstance(tenantId: string): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      const instanceName = tenantId;
      
      await this.makeEvolutionRequest(`/instance/delete/${instanceName}`, 'DELETE');
      
      // Atualizar status no banco
      const connections = await storage.getAllWhatsAppConnections();
      const connection = connections.find(c => c.phone === instanceName);
      if (connection) {
        await storage.updateWhatsAppConnection(connection.id, {
          status: 'destroyed'
        });
      }
      
      return {
        success: true,
        message: 'Instance disconnected successfully'
      };

    } catch (error: any) {
      console.error('Error disconnecting Evolution instance:', error);
      return {
        success: false,
        message: error.message || 'Failed to disconnect instance'
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
      const instanceName = tenantId;
      
      // Formatar número de telefone para WhatsApp
      const formattedNumber = this.formatPhoneNumber(to);
      
      const response = await this.makeEvolutionRequest(`/message/sendText/${instanceName}`, 'POST', {
        number: formattedNumber,
        text: text
      });
      
      return {
        success: true,
        messageId: response.key.id,
        message: 'Message sent successfully'
      };

    } catch (error: any) {
      console.error('Error sending Evolution message:', error);
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
      const instanceName = tenantId;
      const formattedNumber = this.formatPhoneNumber(to);
      
      const messageData = {
        number: formattedNumber,
        [media.type]: {
          url: media.url,
          caption: media.caption
        }
      };

      const response = await this.makeEvolutionRequest(`/message/sendMedia/${instanceName}`, 'POST', messageData);
      
      return {
        success: true,
        messageId: response.key.id,
        message: 'Media message sent successfully'
      };

    } catch (error: any) {
      console.error('Error sending Evolution media message:', error);
      return {
        success: false,
        message: error.message || 'Failed to send media message'
      };
    }
  }

  /**
   * Obter QR Code da instância
   */
  async getQRCode(tenantId: string): Promise<{
    success: boolean;
    qrCode?: string;
    status?: string;
    message?: string;
  }> {
    try {
      const instanceName = tenantId;
      
      const response = await this.makeEvolutionRequest(`/instance/qrcode/${instanceName}`, 'GET');
      
      return {
        success: true,
        qrCode: response.base64,
        status: 'SCAN_QR_CODE',
        message: 'QR Code retrieved successfully'
      };

    } catch (error: any) {
      console.error('Error getting Evolution QR code:', error);
      return {
        success: false,
        message: error.message || 'Failed to get QR code'
      };
    }
  }

  /**
   * Verificar saúde do serviço
   */
  async checkHealth(): Promise<{
    success: boolean;
    status?: string;
    message?: string;
  }> {
    try {
      const response = await this.makeEvolutionRequest('/manager/fetchInstances', 'GET');
      
      return {
        success: true,
        status: 'healthy',
        message: 'Evolution API service is healthy'
      };

    } catch (error: any) {
      console.error('Evolution API health check failed:', error);
      return {
        success: false,
        message: error.message || 'Evolution API service is not available'
      };
    }
  }

  /**
   * Listar todas as instâncias
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
      console.error('Error getting Evolution instances:', error);
      return {
        success: false,
        message: error.message || 'Failed to get instances'
      };
    }
  }

  /**
   * Formatar número de telefone para WhatsApp
   */
  private formatPhoneNumber(phone: string): string {
    // Remover caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Se não começar com código do país, adicionar 55 (Brasil)
    if (cleaned.length === 11 && cleaned.startsWith('11')) {
      return `55${cleaned}`;
    }
    
    // Se já tem código do país, usar como está
    if (cleaned.length >= 12) {
      return cleaned;
    }
    
    // Se tem 10 dígitos, adicionar 55
    if (cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  }

  /**
   * Processar webhook da Evolution API
   */
  async processWebhook(payload: any): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      console.log('📨 Processing Evolution webhook:', JSON.stringify(payload, null, 2));
      
      const { event, instance, data } = payload;
      
      // Extrair tenantId do instance
      const tenantId = instance;
      
      if (event === 'messages.upsert') {
        // Nova mensagem recebida
        const message = data.key;
        const messageData = data.message;
        
        if (messageData && messageData.conversation) {
          // É uma mensagem de texto
          await this.handleIncomingMessage(tenantId, message, messageData);
        }
      } else if (event === 'connection.update') {
        // Atualização de conexão
        await this.handleConnectionUpdate(tenantId, data);
      }
      
      return {
        success: true,
        message: 'Webhook processed successfully'
      };

    } catch (error: any) {
      console.error('Error processing Evolution webhook:', error);
      return {
        success: false,
        message: error.message || 'Failed to process webhook'
      };
    }
  }

  /**
   * Processar mensagem recebida
   */
  private async handleIncomingMessage(tenantId: string, message: any, messageData: any): Promise<void> {
    try {
      // Extrair informações da mensagem
      const from = message.remoteJid;
      const messageId = message.id;
      const content = messageData.conversation || '[Media Message]';
      const timestamp = new Date(message.timestamp * 1000);
      
      // Extrair número de telefone
      const phoneNumber = from.replace('@s.whatsapp.net', '').replace('@c.us', '');
      
      console.log(`📨 Processing message from ${phoneNumber}: ${content}`);
      
      // Encontrar ou criar cliente
      let client = await storage.getClientByPhone(phoneNumber);
      if (!client) {
        client = await storage.createClient({
          name: `Cliente ${phoneNumber}`,
          phone: phoneNumber,
          notes: `Criado automaticamente via Evolution API`
        });
      }

      // Encontrar ou criar conversa
      const conversations = await storage.getAllConversations();
      let conversation = conversations.find(c => 
        c.contactPhone === phoneNumber && 
        c.status !== 'completed' && 
        c.whatsappConnectionId === tenantId
      );

      const isNewConversation = !conversation;
      if (!conversation) {
        conversation = await storage.createConversation({
          contactName: client.name,
          contactPhone: phoneNumber,
          clientId: client.id,
          whatsappConnectionId: tenantId,
          status: 'waiting',
          isGroup: false
        });
      }

      // Criar registro da mensagem
      const savedMessage = await storage.createMessage({
        conversationId: conversation.id,
        content: content,
        messageType: 'text',
        direction: 'incoming',
        isRead: false,
        externalId: messageId
      });

      // Atualizar timestamp da conversa
      await storage.updateConversation(conversation.id, {
        lastMessage: content,
        lastMessageAt: timestamp
      });

      console.log(`✅ Message processed for conversation ${conversation.id}`);

      // Emitir evento via WebSocket APÓS salvar no banco
      try {
        const { websocketService } = await import('./websocket-service');
        
        // Notificar nova mensagem via WebSocket
        websocketService.notifyNewMessage(conversation.id, {
          id: savedMessage.id,
          conversationId: conversation.id,
          content: content,
          messageType: 'text',
          direction: 'incoming',
          timestamp: timestamp.toISOString(),
          isRead: false,
          externalId: messageId
        });

        // Se for nova conversa, notificar também
        if (isNewConversation) {
          websocketService.notifyNewConversation({
            id: conversation.id,
            contactName: conversation.contactName,
            contactPhone: conversation.contactPhone,
            status: conversation.status,
            lastMessage: content,
            lastMessageAt: timestamp.toISOString(),
            unreadCount: 1
          });
        }

        console.log(`📡 WebSocket notification sent for message ${savedMessage.id}`);
      } catch (wsError) {
        console.error('❌ Failed to send WebSocket notification:', wsError);
        // Não falhar o processamento se WebSocket falhar
      }

      // Processar resposta do chatbot
      await this.processChatbotResponse(tenantId, conversation, content, isNewConversation, client.name, client);

    } catch (error) {
      console.error('❌ Error handling incoming message:', error);
    }
  }

  /**
   * Processar atualização de conexão
   */
  private async handleConnectionUpdate(tenantId: string, data: any): Promise<void> {
    try {
      const { state } = data;
      
      // Encontrar conexão no banco
      const connections = await storage.getAllWhatsAppConnections();
      const connection = connections.find(c => c.phone === tenantId);
      
      if (connection) {
        let status = 'disconnected';
        
        switch (state) {
          case 'open':
            status = 'connected';
            break;
          case 'connecting':
            status = 'connecting';
            break;
          case 'close':
            status = 'disconnected';
            break;
        }
        
        await storage.updateWhatsAppConnection(connection.id, {
          status: status as any
        });
        
        console.log(`🔄 Connection status updated for ${tenantId}: ${status}`);
      }

    } catch (error) {
      console.error('❌ Error handling connection update:', error);
    }
  }

  /**
   * Processar resposta automática do chatbot
   */
  private async processChatbotResponse(
    tenantId: string,
    conversation: any,
    messageContent: string,
    isNewConversation: boolean,
    contactName: string,
    client: any
  ): Promise<void> {
    try {
      // Obter configuração do chatbot
      const aiConfig = await storage.getAiAgentConfig();
      if (!aiConfig || !aiConfig.isEnabled || aiConfig.mode !== 'chatbot') {
        console.log('💭 Chatbot is disabled, skipping auto response');
        return;
      }

      const responseDelay = (aiConfig.responseDelay || 3) * 1000;
      let autoResponse = '';

      // Determinar resposta baseada no contexto
      if (isNewConversation && aiConfig.welcomeMessage) {
        // Mensagem de boas-vindas para novas conversas
        autoResponse = this.processMessagePlaceholders(
          aiConfig.welcomeMessage,
          contactName,
          conversation
        );
      } else {
        // Respostas contextuais para conversas existentes
        autoResponse = await this.generateContextualResponse(messageContent, contactName, conversation);
      }

      if (autoResponse) {
        console.log(`🤖 Scheduling chatbot response for ${contactName}: "${autoResponse.substring(0, 50)}..."`);
        
        // Enviar resposta com delay
        setTimeout(async () => {
          try {
            const sent = await this.sendTextMessage(tenantId, conversation.contactPhone, autoResponse);
            if (sent.success) {
              // Salvar resposta automática no banco
              await storage.createMessage({
                conversationId: conversation.id,
                content: autoResponse,
                messageType: 'text',
                direction: 'outgoing',
                isRead: true
              });
              console.log(`✅ Chatbot response sent to ${contactName}`);
            }
          } catch (error) {
            console.error('❌ Failed to send chatbot response:', error);
          }
        }, responseDelay);
      }
    } catch (error) {
      console.error('❌ Error processing chatbot response:', error);
    }
  }

  /**
   * Gerar resposta contextual baseada no conteúdo da mensagem
   */
  private async generateContextualResponse(messageContent: string, contactName: string, conversation: any): Promise<string> {
    const lowerMessage = messageContent.toLowerCase().trim();
    
    // Verificar se está em horário comercial
    const isBusinessHours = this.isBusinessHours();
    
    // Detectar intenção da mensagem
    const intent = this.detectMessageIntent(lowerMessage);
    
    // Gerar resposta baseada na intenção e horário comercial
    switch (intent) {
      case 'greeting':
        return this.getGreetingResponse(contactName, isBusinessHours);
      
      case 'support_request':
        return `Compreendo que você precisa de suporte, ${contactName}! ${
          isBusinessHours 
            ? 'Um atendente irá ajudá-lo em breve.' 
            : 'Estamos fora do horário de atendimento, mas sua mensagem foi registrada e responderemos em breve.'
        }\n\nDigite *menu* para ver as opções disponíveis.`;
      
      case 'urgent_request':
        await this.markConversationAsUrgent(conversation.id);
        return `⚡ Entendi que é urgente, ${contactName}! Sua mensagem foi marcada como prioritária ${
          isBusinessHours 
            ? 'e você será atendido o mais breve possível.'
            : 'e será a primeira a ser atendida quando voltarmos.'
        }`;
      
      case 'menu_request':
        return this.generateMainMenu(contactName);
      
      case 'thanks':
        return `De nada, ${contactName}! 😊 Fico feliz em ajudar! Se precisar de mais alguma coisa, estarei aqui.`;
      
      case 'goodbye':
        return `Até mais, ${contactName}! 👋 Volte sempre que precisar. Tenha um ótimo dia!`;
      
      default:
        return this.getDefaultResponse(contactName, isBusinessHours);
    }
  }

  /**
   * Detectar intenção da mensagem
   */
  private detectMessageIntent(message: string): string {
    const intents = {
      greeting: ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hi'],
      support_request: ['ajuda', 'help', 'suporte', 'problema', 'erro', 'bug', 'quebrou', 'não funciona', 'dúvida'],
      urgent_request: ['urgente', 'emergência', 'emergencia', 'rapido', 'rápido', 'urgent', 'emergency'],
      menu_request: ['menu', 'opções', 'opcoes', 'options', 'ajuda', 'comandos'],
      thanks: ['obrigado', 'obrigada', 'valeu', 'thanks', 'thank you', 'brigado'],
      goodbye: ['tchau', 'bye', 'xau', 'até', 'goodbye', 'see you', 'flw']
    };

    for (const [intent, keywords] of Object.entries(intents)) {
      for (const keyword of keywords) {
        if (message.includes(keyword)) {
          return intent;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Verificar se está em horário comercial
   */
  private isBusinessHours(): boolean {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Segunda a sexta, 9h às 18h
    return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
  }

  /**
   * Obter resposta de saudação baseada no horário
   */
  private getGreetingResponse(contactName: string, isBusinessHours: boolean): string {
    const now = new Date();
    const hour = now.getHours();
    
    let greeting;
    if (hour < 12) {
      greeting = 'Bom dia';
    } else if (hour < 18) {
      greeting = 'Boa tarde';
    } else {
      greeting = 'Boa noite';
    }
    
    const businessStatus = isBusinessHours 
      ? 'Estamos online e prontos para ajudar!' 
      : 'Estamos fora do horário comercial, mas sua mensagem foi recebida.';
    
    return `${greeting}, ${contactName}! 👋\n\n${businessStatus}\n\nDigite *menu* para ver as opções disponíveis.`;
  }

  /**
   * Obter resposta padrão baseada no horário comercial
   */
  private getDefaultResponse(contactName: string, isBusinessHours: boolean): string {
    if (isBusinessHours) {
      return `Olá ${contactName}! 😊 Recebi sua mensagem e um atendente irá ajudá-lo em breve.\n\nDigite *menu* para ver as opções de atendimento.`;
    } else {
      return `Olá ${contactName}! 🌙 Estamos fora do horário comercial (Seg-Sex, 9h-18h), mas sua mensagem foi registrada.\n\nRetornaremos seu contato no próximo dia útil.\n\nDigite *menu* para opções de autoatendimento.`;
    }
  }

  /**
   * Marcar conversa como urgente
   */
  private async markConversationAsUrgent(conversationId: string): Promise<void> {
    try {
      await storage.updateConversation(conversationId, {
        status: 'in_progress'
      });
    } catch (error) {
      console.error('❌ Failed to mark conversation as urgent:', error);
    }
  }

  /**
   * Gerar menu principal
   */
  private generateMainMenu(contactName: string): string {
    return `Olá ${contactName}! 👋\n\n📋 *Menu Principal:*\n\n1️⃣ Suporte Técnico\n2️⃣ Vendas\n3️⃣ Financeiro\n4️⃣ Atendimento Geral\n\n_Digite o número da opção ou descreva seu problema_`;
  }

  /**
   * Processar placeholders nas mensagens
   */
  private processMessagePlaceholders(message: string, contactName: string, conversation: any): string {
    const now = new Date();
    const protocol = `#${conversation.id.substring(0, 8).toUpperCase()}`;
    
    return message
      .replace(/\{\{nome_cliente\}\}/g, contactName)
      .replace(/\{\{nome_empresa\}\}/g, 'Fi.V App')
      .replace(/\{\{protocolo\}\}/g, protocol)
      .replace(/\{\{data_abertura\}\}/g, now.toLocaleString('pt-BR'))
      .replace(/\{\{fila\}\}/g, conversation.queueName || 'Atendimento Geral')
      .replace(/\{\{agente\}\}/g, conversation.agentName || 'Atendente')
      .replace(/\{\{horario_atendimento\}\}/g, 'Segunda a Sexta, 9h às 18h');
  }
}

// Instância singleton do serviço Evolution
export const evolutionService = new EvolutionService();
