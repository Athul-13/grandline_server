import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminQuoteController } from '../../controllers/admin/admin_quote.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { UpdateQuoteStatusRequest } from '../../../application/dtos/quote.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures admin quote routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAdminQuoteRoutesWithDI(): Router {
  const router = Router();
  const adminQuoteController = container.resolve<AdminQuoteController>(
    CONTROLLER_TOKENS.AdminQuoteController
  );

  /**
   * @route   GET /api/v1/admin/quotes
   * @desc    Get all quotes with filtering, sorting, and pagination (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/',
    authenticate,
    requireAdmin,
    (req, res) => void adminQuoteController.getQuotesList(req, res)
  );

  /**
   * @route   GET /api/v1/admin/quotes/:id
   * @desc    Get quote details by ID (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/:id',
    authenticate,
    requireAdmin,
    (req, res) => void adminQuoteController.getQuote(req, res)
  );

  /**
   * @route   PUT /api/v1/admin/quotes/:id/status
   * @desc    Update quote status (admin only)
   * @access  Private (Admin)
   */
  router.put(
    '/:id/status',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateQuoteStatusRequest),
    (req, res) => void adminQuoteController.updateQuoteStatus(req, res)
  );

  return router;
}

