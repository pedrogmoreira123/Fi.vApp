import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { evolutionService } from '../services/evolution.service';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/whatsapp/instance
 * Get WhatsApp instance information
 */
router.get('/instance', async (req: Request, res: Response) => {
  try {
    logger.info({ userId: req.auth?.userId }, 'Getting WhatsApp instance');
    
    // Get tenantId from JWT token (companyId)
    const tenantId = req.auth?.companyId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Company ID not found in token'
      });
    }

    const result = await evolutionService.getInstance(tenantId);
    
    if (result.success) {
      res.json({
        success: true,
        data: {
          id: tenantId,
          name: tenantId,
          connectionStatus: result.status,
          status: result.status,
          qrCode: result.qrCode,
          lastUpdate: new Date().toISOString()
        }
      });
    } else {
      res.json({
        success: false,
        message: result.message || 'No WhatsApp instance found'
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message }, 'WhatsApp instance error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/instance/:id/qrcode
 * Get QR code for instance
 */
router.get('/instance/:id/qrcode', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ instanceId: id, userId: req.auth?.userId }, 'Getting QR code');
    
    const result = await evolutionService.getQRCode(id);
    
    if (result.success) {
      res.json({
        success: true,
        qrCode: result.qrCode,
        status: result.status,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to get QR code'
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message, instanceId: req.params.id }, 'QR code error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/instance/:id/status
 * Get instance status
 */
router.get('/instance/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ instanceId: id, userId: req.auth?.userId }, 'Getting instance status');
    
    const result = await evolutionService.getStatus(id);
    
    res.json({
      success: result.success,
      status: result.status,
      message: result.message
    });
  } catch (error: any) {
    logger.error({ error: error.message, instanceId: req.params.id }, 'Status error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/whatsapp/instance/:id/connect
 * Connect instance (generate QR code)
 */
router.post('/instance/:id/connect', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ instanceId: id, userId: req.auth?.userId }, 'Connecting instance');
    
    const result = await evolutionService.connect(id);
    
    if (result.success) {
      res.json({
        success: true,
        qrCode: result.qrCode,
        status: result.status,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to connect instance'
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message, instanceId: req.params.id }, 'Connect error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/whatsapp/instance/:id
 * Disconnect instance
 */
router.delete('/instance/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    logger.info({ instanceId: id, userId: req.auth?.userId }, 'Disconnecting instance');
    
    const result = await evolutionService.disconnect(id);
    
    res.json({
      success: result.success,
      message: result.message
    });
  } catch (error: any) {
    logger.error({ error: error.message, instanceId: req.params.id }, 'Disconnect error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/conversations/:id/send-message
 * Send message via WhatsApp
 */
router.post('/conversations/:id/send-message', async (req: Request, res: Response) => {
  try {
    const { id: conversationId } = req.params;
    const { text, to, instanceId } = req.body;
    
    logger.info({
      conversationId,
      instanceId,
      to,
      userId: req.auth?.userId
    }, 'Sending WhatsApp message');
    
    if (!text || !to || !instanceId) {
      return res.status(400).json({
        success: false,
        message: 'text, to, and instanceId are required'
      });
    }

    const result = await evolutionService.sendMessage(instanceId, to, text);
    
    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to send message'
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message, conversationId: req.params.id }, 'Send message error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/conversations/:id/send-media
 * Send media message via WhatsApp
 */
router.post('/conversations/:id/send-media', async (req: Request, res: Response) => {
  try {
    const { id: conversationId } = req.params;
    const { to, instanceId, type, url, caption } = req.body;
    
    logger.info({
      conversationId,
      instanceId,
      to,
      type,
      userId: req.auth?.userId
    }, 'Sending WhatsApp media message');
    
    if (!to || !instanceId || !type || !url) {
      return res.status(400).json({
        success: false,
        message: 'to, instanceId, type, and url are required'
      });
    }

    const result = await evolutionService.sendMessage(instanceId, to, caption || '', {
      type: type as 'image' | 'video' | 'audio' | 'document',
      url,
      caption
    });
    
    if (result.success) {
      res.json({
        success: true,
        messageId: result.messageId,
        message: result.message
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to send media message'
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message, conversationId: req.params.id }, 'Send media error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/whatsapp/health
 * Check Evolution API health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    logger.info({ userId: req.auth?.userId }, 'Checking Evolution API health');
    
    const result = await evolutionService.health();
    
    res.json({
      success: result.success,
      status: result.status,
      message: result.message
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Health check error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
