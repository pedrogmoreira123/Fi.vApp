import { Router } from 'express';
import { Request, Response } from 'express';
import { logger } from '../config/logger';
import { evolutionService } from '../services/evolution.service';

const router = Router();

/**
 * POST /api/webhooks/evolution
 * Webhook endpoint for Evolution API events
 */
router.post('/evolution', async (req: Request, res: Response) => {
  try {
    logger.info({ payload: req.body }, 'Received Evolution webhook');
    
    // Process webhook payload
    const result = await evolutionService.processWebhook(req.body);
    
    if (result.success) {
      // Respond immediately to Evolution API to avoid replays
      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
      
      // Emit WebSocket events after responding
      try {
        const { io } = await import('../server');
        
        // Emit system notification
        io.emit('system:notification', {
          type: 'info',
          message: 'Nova mensagem recebida via Evolution API',
          timestamp: new Date().toISOString()
        });
        
        logger.info('WebSocket notification sent for Evolution webhook');
      } catch (wsError) {
        logger.warn({ error: wsError }, 'Failed to send WebSocket notification');
        // Don't fail the webhook if WebSocket fails
      }
    } else {
      logger.error({ result }, 'Failed to process Evolution webhook');
      res.status(400).json({
        success: false,
        message: result.message || 'Failed to process webhook'
      });
    }
  } catch (error: any) {
    logger.error({ error: error.message, payload: req.body }, 'Evolution webhook error');
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/webhooks/evolution/health
 * Health check for webhook endpoint
 */
router.get('/evolution/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Evolution webhook endpoint is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;
