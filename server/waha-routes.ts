import type { Express } from "express";
import { wahaService } from "./waha-service";
import { requireAuth, requireRole } from "./auth";

export function setupWahaRoutes(app: Express): void {
  console.log('🔧 WAHA Routes Configuration:');
  console.log('WAHA_API_URL:', process.env.WAHA_API_URL || 'http://localhost:3001');
  console.log('WAHA_API_KEY:', process.env.WAHA_API_KEY ? '***SET***' : 'NOT SET');

  // POST /api/whatsapp/connect - Iniciar sessão WhatsApp via WAHA
  app.post('/api/whatsapp/connect', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId, name } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: "tenantId is required" 
        });
      }

      const result = await wahaService.startSession(tenantId, name);

      if (result.success) {
        res.json({
          success: true,
          data: {
            sessionId: result.sessionId,
            status: result.status,
            qrCode: result.qrCode,
            message: result.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to start WhatsApp session"
        });
      }

    } catch (error: any) {
      console.error('Failed to connect WhatsApp via WAHA:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to connect WhatsApp", 
        error: error.message 
      });
    }
  });

  // GET /api/whatsapp/status/:tenantId - Obter status da sessão via WAHA
  app.get('/api/whatsapp/status/:tenantId', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await wahaService.getSessionStatus(tenantId);
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            status: result.status,
            qrCode: result.qrCode,
            message: result.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to get session status"
        });
      }

    } catch (error: any) {
      console.error('Failed to get WhatsApp status via WAHA:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get WhatsApp status", 
        error: error.message 
      });
    }
  });

  // DELETE /api/whatsapp/disconnect/:tenantId - Desconectar sessão via WAHA
  app.delete('/api/whatsapp/disconnect/:tenantId', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await wahaService.disconnectSession(tenantId);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to disconnect session"
        });
      }

    } catch (error: any) {
      console.error('Failed to disconnect WhatsApp via WAHA:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to disconnect WhatsApp", 
        error: error.message 
      });
    }
  });

  // POST /api/conversations/:conversationId/send-message - Enviar mensagem via WAHA
  app.post('/api/conversations/:conversationId/send-message', requireAuth, requireRole(['admin', 'supervisor', 'agent']), async (req, res) => {
    try {
      const { conversationId } = req.params;
      const { message, type = 'text', media } = req.body;
      
      if (!message && !media) {
        return res.status(400).json({ 
          success: false,
          message: "Message content is required" 
        });
      }

      // Obter informações da conversa para extrair o tenantId
      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ 
          success: false,
          message: "Conversation not found" 
        });
      }

      const tenantId = conversation.tenantId || conversation.companyId;
      
      let result;
      if (type === 'text') {
        result = await wahaService.sendTextMessage(tenantId, conversation.phoneNumber, message);
      } else if (media) {
        result = await wahaService.sendMediaMessage(tenantId, conversation.phoneNumber, {
          type: media.type,
          url: media.url,
          caption: media.caption
        });
      } else {
        return res.status(400).json({ 
          success: false,
          message: "Invalid message type" 
        });
      }

      if (result.success) {
        // Salvar mensagem no banco de dados
        await storage.createMessage({
          conversationId,
          content: message || media.caption,
          type: type === 'text' ? 'text' : media.type,
          direction: 'outbound',
          status: 'sent',
          metadata: {
            wahaMessageId: result.messageId,
            mediaUrl: media?.url
          }
        });

        res.json({
          success: true,
          data: {
            messageId: result.messageId,
            message: result.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to send message"
        });
      }

    } catch (error: any) {
      console.error('Failed to send message via WAHA:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to send message", 
        error: error.message 
      });
    }
  });

  // GET /api/whatsapp/sessions - Listar todas as sessões WAHA
  app.get('/api/whatsapp/sessions', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const result = await wahaService.getAllSessions();
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            sessions: result.sessions
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to get sessions"
        });
      }

    } catch (error: any) {
      console.error('Failed to get WAHA sessions:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get sessions", 
        error: error.message 
      });
    }
  });

  // GET /api/whatsapp/test - Rota de teste sem autenticação
  app.get('/api/whatsapp/test', async (req, res) => {
    try {
      const result = await wahaService.checkHealth();
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            status: result.status,
            message: result.message
          }
        });
      } else {
        res.status(503).json({
          success: false,
          message: result.message || "WAHA service is not available"
        });
      }

    } catch (error: any) {
      console.error('WAHA test failed:', error);
      res.status(503).json({ 
        success: false,
        message: "WAHA service test failed", 
        error: error.message 
      });
    }
  });

  // GET /api/whatsapp/qr - Obter QR code sem autenticação (para teste)
  app.get('/api/whatsapp/qr', async (req, res) => {
    try {
      const result = await wahaService.getSessionStatus('default');
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            status: result.status,
            qrCode: result.qrCode,
            message: result.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to get QR code"
        });
      }

    } catch (error: any) {
      console.error('Failed to get QR code:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get QR code", 
        error: error.message 
      });
    }
  });

  // POST /api/whatsapp/connect-test - Testar conexão sem autenticação
  app.post('/api/whatsapp/connect-test', async (req, res) => {
    try {
      const { tenantId, name } = req.body;
      
      if (!tenantId) {
        return res.status(400).json({ 
          success: false,
          message: "tenantId is required" 
        });
      }

      const result = await wahaService.startSession(tenantId, name);

      if (result.success) {
        res.json({
          success: true,
          data: {
            sessionId: result.sessionId,
            status: result.status,
            qrCode: result.qrCode,
            message: result.message
          }
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to start WhatsApp session"
        });
      }

    } catch (error: any) {
      console.error('Failed to connect WhatsApp via WAHA:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to connect WhatsApp", 
        error: error.message 
      });
    }
  });

  // GET /api/whatsapp/health - Verificar saúde do WAHA (público)
  app.get('/api/whatsapp/health', async (req, res) => {
    try {
      const result = await wahaService.checkHealth();
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            status: result.status,
            message: result.message
          }
        });
      } else {
        res.status(503).json({
          success: false,
          message: result.message || "WAHA service is not available"
        });
      }

    } catch (error: any) {
      console.error('WAHA health check failed:', error);
      res.status(503).json({ 
        success: false,
        message: "WAHA service health check failed", 
        error: error.message 
      });
    }
  });

  // GET /api/whatsapp/session/:tenantId/info - Obter informações detalhadas da sessão
  app.get('/api/whatsapp/session/:tenantId/info', requireAuth, requireRole(['admin', 'superadmin']), async (req, res) => {
    try {
      const { tenantId } = req.params;
      
      const result = await wahaService.getSessionInfo(tenantId);
      
      if (result.success) {
        res.json({
          success: true,
          data: result.info
        });
      } else {
        res.status(500).json({
          success: false,
          message: result.message || "Failed to get session info"
        });
      }

    } catch (error: any) {
      console.error('Failed to get WAHA session info:', error);
      res.status(500).json({ 
        success: false,
        message: "Failed to get session info", 
        error: error.message 
      });
    }
  });
}
