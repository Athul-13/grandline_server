import { Router } from 'express';
import { container } from 'tsyringe';
import { DriverController } from '../../controllers/driver/driver.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { LoginDriverRequest, ChangeDriverPasswordRequest, UpdateProfilePictureRequest, UpdateLicenseCardPhotoRequest, UpdateOnboardingPasswordRequest } from '../../../application/dtos/driver.dto';
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

  /**
   * Update Profile Picture (Onboarding)
   * PUT /api/v1/driver/profile-picture
   * Requires authentication
   */
  router.put(
    '/profile-picture',
    authenticate,
    validationMiddleware(UpdateProfilePictureRequest),
    (req, res) => void driverController.updateProfilePicture(req, res)
  );

  /**
   * Update License Card Photo (Onboarding)
   * PUT /api/v1/driver/license-card
   * Requires authentication
   */
  router.put(
    '/license-card',
    authenticate,
    validationMiddleware(UpdateLicenseCardPhotoRequest),
    (req, res) => void driverController.updateLicenseCardPhoto(req, res)
  );

  /**
   * Update Password During Onboarding (Optional)
   * PUT /api/v1/driver/onboarding/password
   * Requires authentication
   */
  router.put(
    '/onboarding/password',
    authenticate,
    validationMiddleware(UpdateOnboardingPasswordRequest),
    (req, res) => void driverController.updateOnboardingPassword(req, res)
  );

  /**
   * Get Driver Profile
   * GET /api/v1/driver/profile
   * Requires authentication
   */
  router.get(
    '/profile',
    authenticate,
    (req, res) => void driverController.getDriverProfile(req, res)
  );

  return router;
}

