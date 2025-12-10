import { Router } from 'express';
import { container } from 'tsyringe';
import { PaymentController } from '../../controllers/quote/payment.controller';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures webhook routes
 * Webhook routes do NOT use authentication middleware
 * They use signature verification instead
 */
export function createWebhookRoutesWithDI(): Router {
  const router = Router();
  const paymentController = container.resolve<PaymentController>(CONTROLLER_TOKENS.PaymentController);

  /**
   * @route   POST /api/v1/webhooks/stripe
   * @desc    Handle Stripe webhook events
   * @access  Public (verified via Stripe signature)
   * @note    This route requires raw body for signature verification
   */
  router.post(
    '/stripe',
    // Express.raw({ type: 'application/json' }) middleware should be applied in app.ts
    (req, res) => void paymentController.handleWebhook(req, res)
  );

  return router;
}
