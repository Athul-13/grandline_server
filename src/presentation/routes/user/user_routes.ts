import { Router } from 'express';
import { UserController } from '../../controllers/user/user.controller';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { UpdateUserProfileRequest, ChangePasswordRequest } from '../../../application/dtos/user.dto';

/**
 * Route configuration interface
 * Defines dependencies for route setup
 */
interface UserRoutesConfig {
  userController: UserController;
}

/**
 * Creates and configures user routes
 */
export function createUserRoutes(config: UserRoutesConfig): Router {
  const router = Router();
  const { userController } = config;

  /**
   * Get User Profile
   * GET /api/v1/user/profile
   * Requires authentication
   */
  router.get(
    '/profile',
    authenticate,
    (req, res) => void userController.getUserProfile(req, res)
  );

  /**
   * Update User Profile
   * PATCH /api/v1/user/profile
   * Requires authentication
   */
  router.patch(
    '/profile',
    authenticate,
    validationMiddleware(UpdateUserProfileRequest),
    (req, res) => void userController.updateUserProfile(req, res)
  );

  /**
   * Generate Signed Upload URL for Profile Picture
   * GET /api/v1/user/profile/upload-url
   * Requires authentication
   */
  router.get(
    '/profile/upload-url',
    authenticate,
    (req, res) => void userController.generateUploadUrl(req, res)
  );

  /**
   * Change Password
   * POST /api/v1/user/change-password
   * Requires authentication
   */
  router.post(
    '/change-password',
    authenticate,
    validationMiddleware(ChangePasswordRequest),
    (req, res) => void userController.changePassword(req, res)
  );

  return router;
}

/**
 * Factory function to create user routes with DI resolution
 */
import { container } from '../../../infrastructure/di';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

export function createUserRoutesWithDI(): Router {
  const userController = container.resolve<UserController>(CONTROLLER_TOKENS.UserController);

  return createUserRoutes({
    userController,
  });
}

