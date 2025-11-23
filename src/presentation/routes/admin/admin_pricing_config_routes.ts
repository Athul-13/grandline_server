import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminPricingConfigController } from '../../controllers/admin/admin_pricing_config.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreatePricingConfigRequest } from '../../../application/dtos/pricing_config.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures admin pricing config routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAdminPricingConfigRoutesWithDI(): Router {
  const router = Router();
  const adminPricingConfigController = container.resolve<AdminPricingConfigController>(
    CONTROLLER_TOKENS.AdminPricingConfigController
  );

  /**
   * @route   GET /api/v1/admin/pricing-config
   * @desc    Get active pricing configuration (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/',
    authenticate,
    requireAdmin,
    (req, res) => void adminPricingConfigController.getActiveConfig(req, res)
  );

  /**
   * @route   POST /api/v1/admin/pricing-config
   * @desc    Create new pricing configuration version (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/',
    authenticate,
    requireAdmin,
    validationMiddleware(CreatePricingConfigRequest),
    (req, res) => void adminPricingConfigController.createConfig(req, res)
  );

  /**
   * @route   GET /api/v1/admin/pricing-config/history
   * @desc    Get all pricing configuration versions (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/history',
    authenticate,
    requireAdmin,
    (req, res) => void adminPricingConfigController.getHistory(req, res)
  );

  /**
   * @route   PUT /api/v1/admin/pricing-config/:id/activate
   * @desc    Activate a pricing configuration version (admin only)
   * @access  Private (Admin)
   */
  router.put(
    '/:id/activate',
    authenticate,
    requireAdmin,
    (req, res) => void adminPricingConfigController.activateConfig(req, res)
  );

  return router;
}

