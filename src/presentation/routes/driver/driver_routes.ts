import { Router } from 'express';
import { container } from 'tsyringe';
import { DriverController } from '../../controllers/driver/driver.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { LoginDriverRequest, ChangeDriverPasswordRequest, ForgotDriverPasswordRequest, ResetDriverPasswordRequest, UpdateProfilePictureRequest, UpdateLicenseCardPhotoRequest, UpdateOnboardingPasswordRequest, CompleteOnboardingRequest, SaveFcmTokenRequest } from '../../../application/dtos/driver.dto';
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
   * Driver Forgot Password
   * POST /api/v1/driver/auth/forgot-password
   * Public endpoint - no authentication required
   */
  router.post(
    '/auth/forgot-password',
    validationMiddleware(ForgotDriverPasswordRequest),
    (req, res) => void driverController.forgotDriverPassword(req, res)
  );

  /**
   * Driver Reset Password
   * POST /api/v1/driver/auth/reset-password
   * Public endpoint - no authentication required
   */
  router.post(
    '/auth/reset-password',
    validationMiddleware(ResetDriverPasswordRequest),
    (req, res) => void driverController.resetDriverPassword(req, res)
  );

  /**
   * Change Driver Password (authenticated)
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

  /**
   * Generate Signed Upload URL for Driver Profile Picture/License Card
   * GET /api/v1/driver/profile/upload-url
   * Requires authentication
   */
  router.get(
    '/profile/upload-url',
    authenticate,
    (req, res) => void driverController.generateUploadUrl(req, res)
  );

  /**
   * Complete Driver Onboarding
   * POST /api/v1/driver/onboarding
   * Requires authentication
   */
  router.post(
    '/onboarding',
    authenticate,
    validationMiddleware(CompleteOnboardingRequest),
    (req, res) => void driverController.completeOnboarding(req, res)
  );

  /**
   * Get Driver Info
   * GET /api/v1/driver/info
   * Requires authentication
   */
  router.get(
    '/info',
    authenticate,
    (req, res) => void driverController.getDriverInfo(req, res)
  );

  /**
   * Save Driver FCM Token
   * POST /api/v1/driver/fcm-token
   * Requires authentication
   */
  router.post(
    '/fcm-token',
    authenticate,
    validationMiddleware(SaveFcmTokenRequest),
    (req, res) => void driverController.saveFcmToken(req, res)
  );

  /**
   * Driver Dashboard (Trips)
   * GET /api/v1/driver/dashboard
   * Requires authentication
   */
  router.get(
    '/dashboard',
    authenticate,
    (req, res) => void driverController.getDashboard(req, res)
  );

  /**
   * Get Driver Reservation Details
   * GET /api/v1/driver/reservations/:id
   * Requires authentication
   */
  router.get(
    '/reservations/:id',
    authenticate,
    (req, res) => void driverController.getReservation(req, res)
  );

  return router;
}

