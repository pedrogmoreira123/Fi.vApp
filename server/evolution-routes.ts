import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { requireAuth, requireRole } from "./auth";
import { evolutionService } from "./evolution-service";

export function setupEvolutionRoutes(app: Express): void {
  console.log('🔧 Evolution API Routes Configuration');

  // GET /api/evolution/test - Teste público da Evolution API
  app.get('/api/evolution/test', async (req, res) => {
    try {
      console.log('🔍 Evolution test route called');
      const result = await evolutionService.checkHealth();
      console.log('🔍 Evolution test result:', result);
      return res.json(result);
    } catch (error: any) {
      console.error('Evolution API test failed:', error);
      return res.status(500).json({ message: "Evolution API test failed", error: error.message });
    }
  });

  // GET /api/whatsapp/test - Teste público para verificar instância conectada
  app.get('/api/whatsapp/test', async (req, res) => {
    try {
      console.log('🔍 WhatsApp test route called');
      
      // Buscar instância conectada
      const instances = await evolutionService.getAllInstances();
      const connectedInstance = instances.instances?.find((instance: any) => 
        instance.name === '59b4b086-9171-4dbf-8177-b7c6d6fd1e33' || 
        instance.id === '59b4b086-9171-4dbf-8177-b7c6d6fd1e33'
      );
      
      if (connectedInstance) {
        // Obter status atual
        const instanceStatus = await evolutionService.getInstanceInfo(connectedInstance.name);
        
        res.json({
          success: true,
          data: {
            ...connectedInstance,
            connectionStatus: instanceStatus.status || connectedInstance.connectionStatus,
            status: instanceStatus.status || connectedInstance.connectionStatus
          }
        });
      } else {
        res.json({
          success: false,
          message: "No connected instance found"
        });
      }
    } catch (error: any) {
      console.error('WhatsApp test failed:', error);
      res.status(500).json({ message: "WhatsApp test failed", error: error.message });
    }
  });

  // POST /api/whatsapp/connect - Rota de compatibilidade (redireciona para Evolution API)
  app.post('/api/whatsapp/connect', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId, name } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }

      const result = await evolutionService.createInstance(tenantId, name || `WhatsApp Connection ${tenantId}`);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Failed to connect Evolution instance:', error);
      res.status(500).json({ message: "Failed to connect Evolution instance", error: error.message });
    }
  });

  // POST /api/evolution/connect - Criar nova instância WhatsApp
  app.post('/api/evolution/connect', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId, name } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ message: "tenantId is required" });
      }

      const result = await evolutionService.createInstance(tenantId, name || `WhatsApp Connection ${tenantId}`);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Failed to connect Evolution instance:', error);
      res.status(500).json({ message: "Failed to connect Evolution instance", error: error.message });
    }
  });

  // GET /api/evolution/status/:tenantId - Obter status da instância
  app.get('/api/evolution/status/:tenantId', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await evolutionService.getInstanceInfo(tenantId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Failed to get Evolution status:', error);
      res.status(500).json({ message: "Failed to get Evolution status", error: error.message });
    }
  });

  // GET /api/evolution/qrcode/:tenantId - Obter QR Code
  app.get('/api/evolution/qrcode/:tenantId', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await evolutionService.getQRCode(tenantId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Failed to get Evolution QR code:', error);
      res.status(500).json({ message: "Failed to get Evolution QR code", error: error.message });
    }
  });

  // POST /api/evolution/connect/:tenantId - Conectar instância (gerar QR)
  app.post('/api/evolution/connect/:tenantId', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await evolutionService.connectInstance(tenantId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Failed to connect Evolution instance:', error);
      res.status(500).json({ message: "Failed to connect Evolution instance", error: error.message });
    }
  });

  // DELETE /api/evolution/disconnect/:tenantId - Desconectar instância
  app.delete('/api/evolution/disconnect/:tenantId', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await evolutionService.disconnectInstance(tenantId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Failed to disconnect Evolution instance:', error);
      res.status(500).json({ message: "Failed to disconnect Evolution instance", error: error.message });
    }
  });

  // POST /api/conversations/:conversationId/send-message - Enviar mensagem via Evolution
  app.post('/api/conversations/:conversationId/send-message', requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { text, to } = req.body;

      if (!text || !to) {
        return res.status(400).json({ message: "text and to are required" });
      }

      // Obter detalhes da conversa
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Obter tenantId da conexão WhatsApp da conversa
      const tenantId = conversation.whatsappConnectionId;
      if (!tenantId) {
        return res.status(400).json({ message: "No WhatsApp connection found for this conversation" });
      }

      // Enviar mensagem via Evolution API
      const result = await evolutionService.sendTextMessage(tenantId, to, text);

      if (result.success) {
        // Salvar mensagem enviada no banco
        const message = await storage.createMessage({
          conversationId,
          content: text,
          direction: 'outgoing',
          status: 'sent',
          timestamp: new Date(),
          externalId: result.messageId
        });

        res.json({
          success: true,
          message: message,
          serviceResponse: result
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      res.status(500).json({ message: "Failed to send message", error: error.message });
    }
  });

  // POST /api/conversations/:conversationId/send-media - Enviar mídia via Evolution
  app.post('/api/conversations/:conversationId/send-media', requireAuth, async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { to, type, url, caption } = req.body;

      if (!to || !type || !url) {
        return res.status(400).json({ message: "to, type, and url are required" });
      }

      // Obter detalhes da conversa
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      // Obter tenantId da conexão WhatsApp da conversa
      const tenantId = conversation.whatsappConnectionId;
      if (!tenantId) {
        return res.status(400).json({ message: "No WhatsApp connection found for this conversation" });
      }

      // Enviar mídia via Evolution API
      const result = await evolutionService.sendMediaMessage(tenantId, to, {
        type: type as 'image' | 'video' | 'audio' | 'document',
        url,
        caption
      });

      if (result.success) {
        // Salvar mensagem de mídia enviada no banco
        const message = await storage.createMessage({
          conversationId,
          content: caption || `[${type.toUpperCase()} Message]`,
          messageType: type,
          direction: 'outgoing',
          status: 'sent',
          timestamp: new Date(),
          externalId: result.messageId,
          mediaUrl: url
        });

        res.json({
          success: true,
          message: message,
          serviceResponse: result
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Failed to send media message:', error);
      res.status(500).json({ message: "Failed to send media message", error: error.message });
    }
  });

  // GET /api/evolution/instances - Listar todas as instâncias
  app.get('/api/evolution/instances', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const result = await evolutionService.getAllInstances();
      
      res.json(result);
    } catch (error: any) {
      console.error('Failed to get Evolution instances:', error);
      res.status(500).json({ message: "Failed to get Evolution instances", error: error.message });
    }
  });

  // GET /api/evolution/health - Verificar saúde do serviço
  app.get('/api/evolution/health', requireAuth, async (req, res) => {
    try {
      const result = await evolutionService.checkHealth();
      
      res.json(result);
    } catch (error: any) {
      console.error('Failed to check Evolution health:', error);
      res.status(500).json({ message: "Failed to check Evolution health", error: error.message });
    }
  });

  // ===== NEW GATEWAY ROUTES FOR FRONTEND INTEGRATION =====
  
  // GET /api/whatsapp/instance - Obter detalhes da instância conectada
  app.get('/api/whatsapp/instance', requireAuth, async (req, res) => {
    try {
      // Usar tenantId hardcoded para desenvolvimento
      const tenantId = '59b4b086-9171-4dbf-8177-b7c6d6fd1e33';

      console.log(`🔍 Getting WhatsApp instance for tenant: ${tenantId}`);

      // Buscar instância específica do tenant
      const instances = await evolutionService.getAllInstances();
      
      // Primeiro, tentar encontrar por nome (tenantId)
      let tenantInstance = instances.instances?.find((instance: any) => instance.name === tenantId);
      
      // Se não encontrar, buscar pela instância conectada (59b4b086-9171-4dbf-8177-b7c6d6fd1e33)
      if (!tenantInstance) {
        tenantInstance = instances.instances?.find((instance: any) => 
          instance.name === '59b4b086-9171-4dbf-8177-b7c6d6fd1e33' || 
          instance.id === '59b4b086-9171-4dbf-8177-b7c6d6fd1e33'
        );
      }
      
      console.log(`🔍 Available instances:`, instances.instances?.map((i: any) => ({ id: i.id, name: i.name, status: i.connectionStatus })));
      console.log(`🔍 Looking for tenant: ${tenantId}`);
      
      if (tenantInstance) {
        console.log(`✅ Found instance for tenant ${tenantId}:`, tenantInstance);
        
        // Obter status atual da instância
        const instanceStatus = await evolutionService.getInstanceInfo(tenantInstance.name);
        
        res.json({
          success: true,
          data: {
            ...tenantInstance,
            connectionStatus: instanceStatus.status || tenantInstance.connectionStatus,
            status: instanceStatus.status || tenantInstance.connectionStatus
          }
        });
      } else {
        console.log(`❌ No instance found for tenant: ${tenantId}`);
        res.json({
          success: false,
          message: "No instance found for this tenant"
        });
      }
    } catch (error: any) {
      console.error('Failed to get WhatsApp instance:', error);
      res.status(500).json({ message: "Failed to get WhatsApp instance", error: error.message });
    }
  });

  // POST /api/whatsapp/instance/connect - Conectar instância (criar/gerar QR)
  app.post('/api/whatsapp/instance/connect', async (req, res) => {
    try {
      // Usar tenantId hardcoded para desenvolvimento
      const tenantId = '59b4b086-9171-4dbf-8177-b7c6d6fd1e33';
      const { instanceName, qrcode, integration } = req.body;

      console.log(`🔄 Connecting WhatsApp instance for tenant: ${tenantId}`);

      // Verificar se já existe uma instância conectada
      const instances = await evolutionService.getAllInstances();
      const existingInstance = instances.instances?.find((instance: any) => 
        instance.name === '59b4b086-9171-4dbf-8177-b7c6d6fd1e33' || 
        instance.id === '59b4b086-9171-4dbf-8177-b7c6d6fd1e33'
      );

      if (existingInstance) {
        // Se já existe, obter QR code
        const qrResult = await evolutionService.getQRCode('59b4b086-9171-4dbf-8177-b7c6d6fd1e33');
        
        if (qrResult.success) {
          res.json({
            success: true,
            qrCode: qrResult.qrCode,
            status: 'SCAN_QR_CODE',
            message: 'QR Code generated successfully'
          });
        } else {
          res.json({
            success: false,
            message: 'Failed to generate QR code'
          });
        }
      } else {
        // Criar nova instância
        const result = await evolutionService.createInstance(tenantId, instanceName || `WhatsApp ${tenantId}`);
        res.json(result);
      }
    } catch (error: any) {
      console.error('Failed to connect WhatsApp instance:', error);
      res.status(500).json({ message: "Failed to connect WhatsApp instance", error: error.message });
    }
  });

  // POST /api/whatsapp/instance/restart - Reiniciar instância
  app.post('/api/whatsapp/instance/restart', requireAuth, async (req, res) => {
    try {
      // Obter tenantId do token JWT (companyId)
      const tenantId = req.auth?.companyId;
      
      if (!tenantId) {
        return res.status(400).json({ message: "Company ID not found in token" });
      }

      console.log(`🔄 Restarting WhatsApp instance for tenant: ${tenantId}`);

      // Primeiro desconectar
      await evolutionService.disconnectInstance(tenantId);
      
      // Aguardar um pouco
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reconectar
      const result = await evolutionService.createInstance(tenantId, `WhatsApp ${tenantId}`);
      
      console.log(`🔄 Restart result for tenant ${tenantId}:`, result);
      res.json(result);
    } catch (error: any) {
      console.error('Failed to restart WhatsApp instance:', error);
      res.status(500).json({ message: "Failed to restart WhatsApp instance", error: error.message });
    }
  });

  // DELETE /api/whatsapp/instance/disconnect - Desconectar instância
  app.delete('/api/whatsapp/instance/disconnect', async (req, res) => {
    try {
      // Usar tenantId hardcoded para desenvolvimento
      const tenantId = '59b4b086-9171-4dbf-8177-b7c6d6fd1e33';

      console.log(`🔌 Disconnecting WhatsApp instance for tenant: ${tenantId}`);

      const result = await evolutionService.disconnectInstance(tenantId);
      
      console.log(`🔌 Disconnect result for tenant ${tenantId}:`, result);
      res.json(result);
    } catch (error: any) {
      console.error('Failed to disconnect WhatsApp instance:', error);
      res.status(500).json({ message: "Failed to disconnect WhatsApp instance", error: error.message });
    }
  });

  // POST /api/webhooks/evolution - Webhook para receber mensagens da Evolution API
  app.post('/api/webhooks/evolution', async (req, res) => {
    try {
      console.log('📨 Received Evolution webhook:', JSON.stringify(req.body, null, 2));
      
      const result = await evolutionService.processWebhook(req.body);
      
      if (result.success) {
        // Notify via WebSocket
        try {
          const { websocketService } = await import('./websocket-service');
          websocketService.notifySystemMessage('Nova mensagem recebida via Evolution API', 'info');
        } catch (error) {
          console.warn('⚠️  Failed to notify via WebSocket:', error);
        }
        
        res.json({ success: true, message: 'Webhook processed successfully' });
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error('Failed to process Evolution webhook:', error);
      res.status(500).json({ message: "Failed to process webhook", error: error.message });
    }
  });

  console.log('✅ Evolution API routes registered successfully');
}
