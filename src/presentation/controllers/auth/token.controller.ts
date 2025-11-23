import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IRefreshTokenUseCase } from '../../../application/use-cases/interface/auth/refresh_token_use_case.interface';
import { RefreshTokenRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, COOKIE_NAMES } from '../../../shared/constants';
import { setAccessTokenCookie } from '../../../shared/utils/cookie.util';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

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
      // Read refresh token from HTTP-only cookie (not from request body)
      const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
      
      if (!refreshToken) {
        logger.warn('Refresh token not found in cookies');
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token not found',
        });
        return;
      }

      const request: RefreshTokenRequest = { refreshToken };
      const response = await this.refreshTokenUseCase.execute(request);

      // Set new access token in HTTP-only cookie
      setAccessTokenCookie(res, response.accessToken);

      sendSuccessResponse(res, HTTP_STATUS.OK, {
        message: 'Access token refreshed successfully',
      });
    } catch (error) {
      logger.error(`Error refreshing access token: ${error instanceof Error ? error.message : String(error)}`);
      sendErrorResponse(res, error);
    }
  }
}