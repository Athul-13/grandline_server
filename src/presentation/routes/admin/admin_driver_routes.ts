import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminDriverController } from '../../controllers/admin/admin_driver.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { CreateDriverRequest, UpdateDriverRequest, UpdateDriverStatusRequest } from '../../../application/dtos/driver.dto';
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
   * @route   GET /api/v1/admin/drivers/statistics
   * @desc    Get driver statistics (admin only)
   * @access  Private (Admin)
   * IMPORTANT: This must come BEFORE /:driverId route to avoid route conflicts
   */
  router.get(
    '/statistics',
    authenticate,
    requireAdmin,
    (req, res) => void adminDriverController.getDriverStatistics(req, res)
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

  /**
   * @route   PATCH /api/v1/admin/drivers/:driverId
   * @desc    Update driver details (admin only)
   * @access  Private (Admin)
   */
  router.patch(
    '/:driverId',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateDriverRequest),
    (req, res) => void adminDriverController.updateDriver(req, res)
  );

  /**
   * @route   PATCH /api/v1/admin/drivers/:driverId/status
   * @desc    Update driver status (admin only)
   * @access  Private (Admin)
   */
  router.patch(
    '/:driverId/status',
    authenticate,
    requireAdmin,
    validationMiddleware(UpdateDriverStatusRequest),
    (req, res) => void adminDriverController.updateDriverStatus(req, res)
  );

  /**
   * @route   DELETE /api/v1/admin/drivers/:driverId
   * @desc    Delete driver (soft delete) (admin only)
   * @access  Private (Admin)
   */
  router.delete(
    '/:driverId',
    authenticate,
    requireAdmin,
    (req, res) => void adminDriverController.deleteDriver(req, res)
  );

  /**
   * @route   POST /api/v1/admin/drivers/:driverId/payout
   * @desc    Record driver payout (admin only)
   * @access  Private (Admin)
   */
  router.post(
    '/:driverId/payout',
    authenticate,
    requireAdmin,
    (req, res) => void adminDriverController.recordDriverPayout(req, res)
  );

  return router;
}

