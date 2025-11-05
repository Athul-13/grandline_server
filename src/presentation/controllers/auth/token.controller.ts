import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IRefreshTokenUseCase } from '../../../application/use-cases/interface/auth/refresh_token_use_case.interface';
import { RefreshTokenRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { setAccessTokenCookie } from '../../../shared/utils/cookie.util';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';

/**
 * Token controller
 * Handles token operations like refresh
 */
@injectable()
export class TokenController {
  constructor(
    @inject(USE_CASE_TOKENS.RefreshTokenUseCase)
    private readonly refreshTokenUseCase: IRefreshTokenUseCase
  ) {}

  /**
   * Handles refresh token request
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const request: RefreshTokenRequest = req.body;
      const response = await this.refreshTokenUseCase.execute(request);

      // Set new access token in HTTP-only cookie
      setAccessTokenCookie(res, response.accessToken);

      sendSuccessResponse(res, HTTP_STATUS.OK, {
        message: 'Access token refreshed successfully',
      });
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
}