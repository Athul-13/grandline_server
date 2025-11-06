import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ILoginUserUseCase } from '../../../application/use-cases/interface/auth/login_user_use_case.interface';
import { IRegisterUserUseCase } from '../../../application/use-cases/interface/auth/register_user_use_case.interface';
import { ILogoutUserUseCase } from '../../../application/use-cases/interface/auth/logout_user_use_case.interface';
import { IForgotPasswordUseCase } from '../../../application/use-cases/interface/auth/forgot_password_use_case.interface';
import { IResetPasswordUseCase } from '../../../application/use-cases/interface/auth/reset_password_use_case.interface';
import { IGoogleAuthUseCase } from '../../../application/use-cases/interface/auth/google_auth_use_case.interface';
import { ISetupPasswordUseCase } from '../../../application/use-cases/interface/auth/setup_password_use_case.interface';
import { ILinkGoogleAccountUseCase } from '../../../application/use-cases/interface/auth/link_google_account_use_case.interface';
import { RegisterUserRequest, LoginUserRequest, LogoutUserRequest, ForgotPasswordRequest, ResetPasswordRequest, GoogleAuthRequest, SetupPasswordRequest, LinkGoogleRequest } from '../../../application/dtos/user.dto';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES, COOKIE_NAMES, ERROR_MESSAGES } from '../../../shared/constants';
import { setAccessTokenCookie, setRefreshTokenCookie, clearAllAuthCookies } from '../../../shared/utils/cookie.util';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Authentication controller
 * Handles user registration, login, logout, and password reset operations
 */
@injectable()
export class AuthController {
  constructor(
    @inject(USE_CASE_TOKENS.RegisterUserUseCase)
    private readonly registerUserUseCase: IRegisterUserUseCase,
    @inject(USE_CASE_TOKENS.LoginUserUseCase)
    private readonly loginUserUseCase: ILoginUserUseCase,
    @inject(USE_CASE_TOKENS.LogoutUserUseCase)
    private readonly logoutUserUseCase: ILogoutUserUseCase,
    @inject(USE_CASE_TOKENS.ForgotPasswordUseCase)
    private readonly forgotPasswordUseCase: IForgotPasswordUseCase,
    @inject(USE_CASE_TOKENS.ResetPasswordUseCase)
    private readonly resetPasswordUseCase: IResetPasswordUseCase,
    @inject(USE_CASE_TOKENS.GoogleAuthUseCase)
    private readonly googleAuthUseCase: IGoogleAuthUseCase,
    @inject(USE_CASE_TOKENS.SetupPasswordUseCase)
    private readonly setupPasswordUseCase: ISetupPasswordUseCase,
    @inject(USE_CASE_TOKENS.LinkGoogleAccountUseCase)
    private readonly linkGoogleAccountUseCase: ILinkGoogleAccountUseCase
  ) {}

  /**
   * Handles user registration
   */
  async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const request: RegisterUserRequest = req.body;
      const response = await this.registerUserUseCase.execute(request);

      sendSuccessResponse(res, HTTP_STATUS.CREATED, response, SUCCESS_MESSAGES.USER_REGISTERED);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles user login
   */
  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const request: LoginUserRequest = req.body;
      const response = await this.loginUserUseCase.execute(request);

      // Set HTTP-only cookies for tokens
      setAccessTokenCookie(res, response.accessToken);
      if (response.refreshToken) {
        setRefreshTokenCookie(res, response.refreshToken);
      }

      sendSuccessResponse(res, HTTP_STATUS.OK, { user: response.user }, SUCCESS_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles user logout
   */
  async logoutUser(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];

      const request: LogoutUserRequest = { refreshToken };
      const response = await this.logoutUserUseCase.execute(request);

      clearAllAuthCookies(res);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles forgot password request
   */
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const request: ForgotPasswordRequest = req.body;
      const response = await this.forgotPasswordUseCase.execute(request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles password reset
   */
  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const request: ResetPasswordRequest = req.body;
      const response = await this.resetPasswordUseCase.execute(request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles Google authentication (sign-in/login)
   */
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const request: GoogleAuthRequest = req.body;
      const response = await this.googleAuthUseCase.execute(request);

      // Set HTTP-only cookies for tokens
      setAccessTokenCookie(res, response.accessToken);
      if (response.refreshToken) {
        setRefreshTokenCookie(res, response.refreshToken);
      }

      sendSuccessResponse(res, HTTP_STATUS.OK, { user: response.user }, SUCCESS_MESSAGES.GOOGLE_AUTH_SUCCESS);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles password setup for Google-authenticated users
   */
  async setupPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const request: SetupPasswordRequest = req.body;
      const response = await this.setupPasswordUseCase.execute(req.user.userId, request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.PASSWORD_SETUP_SUCCESS);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles linking Google account to existing credential account
   */
  async linkGoogleAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }

      const request: LinkGoogleRequest = req.body;
      const response = await this.linkGoogleAccountUseCase.execute(req.user.userId, request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.GOOGLE_ACCOUNT_LINKED);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
}