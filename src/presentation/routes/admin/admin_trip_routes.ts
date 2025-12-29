import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminTripController } from '../../controllers/admin/admin_trip.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures admin trip routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAdminTripRoutesWithDI(): Router {
  const router = Router();
  const adminTripController = container.resolve<AdminTripController>(
    CONTROLLER_TOKENS.AdminTripController
  );

  /**
   * @route   GET /api/v1/admin/trips
   * @desc    Get all trips with filtering, sorting, and pagination (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/',
    authenticate,
    requireAdmin,
    (req, res) => void adminTripController.getTripsList(req, res)
  );

  return router;
}

