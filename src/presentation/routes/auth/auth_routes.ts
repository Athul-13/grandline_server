import { Router } from 'express';
import { AuthController } from '../../controllers/auth/auth.controller';
import { OtpController } from '../../controllers/auth/otp.controller';
import { TokenController } from '../../controllers/auth/token.controller';
import { validationMiddleware } from '../../middleware/validation.middleware';
import { authenticate } from '../../middleware/auth.middleware';
import { RegisterUserRequest, LoginUserRequest, VerifyOtpRequest, ResendOtpRequest, ForgotPasswordRequest, ResetPasswordRequest, GoogleAuthRequest, SetupPasswordRequest, LinkGoogleRequest } from '../../../application/dtos/user.dto';

/**
 * Route configuration interface
 * Defines dependencies for route setup
 */
interface AuthRoutesConfig {
  authController: AuthController;
  otpController: OtpController;
  tokenController: TokenController;
}

/**
 * Creates and configures authentication routes
 * Factory pattern allows dependency injection and easy testing
 */
export function createAuthRoutes(config: AuthRoutesConfig): Router {
  const router = Router();
  const { authController, otpController, tokenController } = config;

  /**
   * User Registration
   * POST /api/v1/auth/register
   */
  router.post(
    '/register',
    validationMiddleware(RegisterUserRequest),
    (req, res) => void authController.registerUser(req, res)
  );

  /**
   * User Login
   * POST /api/v1/auth/login
   */
  router.post(
    '/login',
    validationMiddleware(LoginUserRequest),
    (req, res) => void authController.loginUser(req, res)
  );

  /**
   * Verify OTP
   * POST /api/v1/auth/otp/verify
   */
  router.post(
    '/otp/verify',
    validationMiddleware(VerifyOtpRequest),
    (req, res) => void otpController.verifyOtp(req, res)
  );

  /**
   * Resend OTP
   * POST /api/v1/auth/otp/resend
   */
  router.post(
    '/otp/resend',
    validationMiddleware(ResendOtpRequest),
    (req, res) => void otpController.resendOtp(req, res)
  );

  /**
   * Refresh Access Token
   * POST /api/v1/auth/token/refresh
   */
  router.post(
    '/token/refresh',
    (req, res) => void tokenController.refreshToken(req, res)
  );

  /**
   * User Logout
   * POST /api/v1/auth/logout
   * Requires authentication
   */
  router.post(
    '/logout',
    authenticate,
    (req, res) => void authController.logoutUser(req, res)
  );

  /**
   * Forgot Password
   * POST /api/v1/auth/forgot-password
   */
  router.post(
    '/forgot-password',
    validationMiddleware(ForgotPasswordRequest),
    (req, res) => void authController.forgotPassword(req, res)
  );

  /**
   * Reset Password
   * POST /api/v1/auth/reset-password
   */
  router.post(
    '/reset-password',
    validationMiddleware(ResetPasswordRequest),
    (req, res) => void authController.resetPassword(req, res)
  );

  /**
   * Google Authentication (Sign-in/Login)
   * POST /api/v1/auth/google
   */
  router.post(
    '/google',
    validationMiddleware(GoogleAuthRequest),
    (req, res) => void authController.googleAuth(req, res)
  );

  /**
   * Setup Password (for Google-authenticated users)
   * POST /api/v1/auth/setup-password
   * Requires authentication
   */
  router.post(
    '/setup-password',
    authenticate,
    validationMiddleware(SetupPasswordRequest),
    (req, res) => void authController.setupPassword(req, res)
  );

  /**
   * Link Google Account (for credential-authenticated users)
   * POST /api/v1/auth/link-google
   * Requires authentication
   */
  router.post(
    '/link-google',
    authenticate,
    validationMiddleware(LinkGoogleRequest),
    (req, res) => void authController.linkGoogleAccount(req, res)
  );

  return router;
}

/**
 * Factory function to create auth routes with DI resolution
 * Resolves controllers from DI container when called
 * This ensures controllers are registered before resolution
 */
import { container } from '../../../infrastructure/di';
import { CONTROLLER_TOKENS } from '../../../infrastructure/di/tokens';

export function createAuthRoutesWithDI(): Router {
  const authController = container.resolve<AuthController>(CONTROLLER_TOKENS.AuthController);
  const otpController = container.resolve<OtpController>(CONTROLLER_TOKENS.OtpController);
  const tokenController = container.resolve<TokenController>(CONTROLLER_TOKENS.TokenController);

  return createAuthRoutes({
    authController,
    otpController,
    tokenController,
  });
}
