import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminDriverController } from '../../controllers/admin/admin_driver.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateDriverRequest } from '../../../application/dtos/driver.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures admin driver routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAdminDriverRoutesWithDI(): Router {
  const router = Router();
  const adminDriverController = container.resolve<AdminDriverController>(
    CONTROLLER_TOKENS.AdminDriverController
  );

  /**
   * @route   POST /api/v1/admin/drivers
   * @desc    Create a new driver (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/',
    authenticate,
    requireAdmin,
    validationMiddleware(CreateDriverRequest),
    (req, res) => void adminDriverController.createDriver(req, res)
  );

  /**
   * @route   GET /api/v1/admin/drivers
   * @desc    Get all drivers with pagination, filtering, and search (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/',
    authenticate,
    requireAdmin,
    (req, res) => void adminDriverController.listDrivers(req, res)
  );

  /**
   * @route   GET /api/v1/admin/drivers/:driverId
   * @desc    Get driver details by ID (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/:driverId',
    authenticate,
    requireAdmin,
    (req, res) => void adminDriverController.getDriverById(req, res)
  );

  return router;
}

