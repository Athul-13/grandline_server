import { Router } from 'express';
import { container } from 'tsyringe';
import { AdminUserController } from '../../controllers/admin/admin_user.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { ChangeUserStatusRequest, ChangeUserRoleRequest, GetUserStatisticsRequest } from '../../../application/dtos/user.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Creates and configures admin user routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAdminUserRoutesWithDI(): Router {
  const router = Router();
  const adminUserController = container.resolve<AdminUserController>(
    CONTROLLER_TOKENS.AdminUserController
  );

  /**
   * @route   GET /api/v1/admin/users
   * @desc    Get all users with pagination, filtering, and search (admin only, regular users only)
   * @access  Private (Admin)
   */
  router.get(
    '/',
    authenticate,
    requireAdmin,
    (req, res) => void adminUserController.listUsers(req, res)
  );

  /**
   * @route   GET /api/v1/admin/users/statistics
   * @desc    Get user statistics (admin only)
   * @access  Private (Admin)
   */
  router.get(
    '/statistics',
    authenticate,
    requireAdmin,
    validationMiddleware(GetUserStatisticsRequest),
    (req, res) => void adminUserController.getUserStatistics(req, res)
  );

  /**
   * @route   GET /api/v1/admin/users/:userId
   * @desc    Get user details by ID (admin only, regular users only)
   * @access  Private (Admin)
   */
  router.get(
    '/:userId',
    authenticate,
    requireAdmin,
    (req, res) => void adminUserController.getUserById(req, res)
  );

  /**
   * @route   PATCH /api/v1/admin/users/:userId/status
   * @desc    Change user status (admin only, regular users only)
   * @access  Private (Admin)
   */
  router.patch(
    '/:userId/status',
    authenticate,
    requireAdmin,
    validationMiddleware(ChangeUserStatusRequest),
    (req, res) => void adminUserController.changeUserStatus(req, res)
  );

  /**
   * @route   PATCH /api/v1/admin/users/:userId/role
   * @desc    Change user role (admin only)
   * @access  Private (Admin)
   */
  router.patch(
    '/:userId/role',
    authenticate,
    requireAdmin,
    validationMiddleware(ChangeUserRoleRequest),
    (req, res) => void adminUserController.changeUserRole(req, res)
  );

  return router;
}

