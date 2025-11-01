import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { LoginUserUseCase } from '../../../application/use-cases/implementation/auth/login-user.use-case';
import { RegisterUserUseCase } from '../../../application/use-cases/implementation/auth/register-user.use-case';
import { RegisterUserRequest, LoginUserRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../../shared/utils/cookie.util';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';

/**
 * Authentication controller
 * Handles user registration and login operations
 */
@injectable()
export class AuthController {
  constructor(
    @inject(USE_CASE_TOKENS.RegisterUserUseCase)
    private readonly registerUserUseCase: RegisterUserUseCase,
    @inject(USE_CASE_TOKENS.LoginUserUseCase)
    private readonly loginUserUseCase: LoginUserUseCase
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
}