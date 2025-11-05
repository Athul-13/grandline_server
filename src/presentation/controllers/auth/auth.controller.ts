import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ILoginUserUseCase } from '../../../application/use-cases/interface/auth/login_user_use_case.interface';
import { IRegisterUserUseCase } from '../../../application/use-cases/interface/auth/register_user_use_case.interface';
import { ILogoutUserUseCase } from '../../../application/use-cases/interface/auth/logout_user_use_case.interface';
import { IForgotPasswordUseCase } from '../../../application/use-cases/interface/auth/forgot_password_use_case.interface';
import { IResetPasswordUseCase } from '../../../application/use-cases/interface/auth/reset_password_use_case.interface';
import { RegisterUserRequest, LoginUserRequest, LogoutUserRequest, ForgotPasswordRequest, ResetPasswordRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES, COOKIE_NAMES } from '../../../shared/constants';
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
    private readonly resetPasswordUseCase: IResetPasswordUseCase
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
}