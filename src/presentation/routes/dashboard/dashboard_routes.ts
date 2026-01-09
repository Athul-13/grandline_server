import { Router } from 'express';
import { container } from 'tsyringe';
import { DashboardController } from '../../controllers/dashboard/dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireAdmin } from '../../middleware/authorize.middleware';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Factory function to create dashboard routes with DI resolution
 */
export function createDashboardRoutesWithDI(): Router {
  const router = Router();
  const dashboardController = container.resolve<DashboardController>(
    CONTROLLER_TOKENS.DashboardController
  );

  /**
   * Get Recent Activity
   * GET /api/v1/dashboard/activity
   * Requires authentication
   */
  router.get(
    '/activity',
    authenticate,
    (req, res) => void dashboardController.getRecentActivity(req, res)
  );

  /**
   * Get Admin Dashboard Analytics
   * GET /api/v1/admin/dashboard/analytics
   * Requires admin authentication
   */
  router.get(
    '/admin/analytics',
    authenticate,
    requireAdmin,
    (req, res) => void dashboardController.getAdminDashboardAnalytics(req, res)
  );

  return router;
}

