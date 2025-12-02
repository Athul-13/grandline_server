import { Router } from 'express';
import { container } from 'tsyringe';
import { DriverController } from '../../controllers/driver/driver.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { LoginDriverRequest, ChangeDriverPasswordRequest } from '../../../application/dtos/driver.dto';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

/**
 * Factory function to create driver routes with DI resolution
 */
export function createDriverRoutesWithDI(): Router {
  const router = Router();
  const driverController = container.resolve<DriverController>(
    CONTROLLER_TOKENS.DriverController
  );

  /**
   * Driver Login
   * POST /api/v1/driver/auth/login
   * Public endpoint - no authentication required
   */
  router.post(
    '/auth/login',
    validationMiddleware(LoginDriverRequest),
    (req, res) => void driverController.loginDriver(req, res)
  );

  /**
   * Change Driver Password
   * POST /api/v1/driver/auth/change-password
   * Requires authentication
   */
  router.post(
    '/auth/change-password',
    authenticate,
    validationMiddleware(ChangeDriverPasswordRequest),
    (req, res) => void driverController.changeDriverPassword(req, res)
  );

  return router;
}

