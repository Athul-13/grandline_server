import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IRefreshTokenUseCase } from '../../../application/use-cases/interface/auth/refresh_token_use_case.interface';
import { RefreshTokenRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, COOKIE_NAMES } from '../../../shared/constants';
import { setAccessTokenCookie, setRefreshTokenCookie } from '../../../shared/utils/cookie.util';
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
   * Accepts refresh token from both HTTP-only cookies (web) and request body (mobile)
   * Returns tokens based on client type: cookies for web, body for mobile
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      // Try to get refresh token from cookie first (for web clients)
      const cookieRefreshToken = req.cookies?.[COOKIE_NAMES.REFRESH_TOKEN] as string | undefined;
      
      // Try to get from request body (for mobile clients)
      let bodyRefreshToken: string | undefined;
      const body = req.body as { refreshToken?: unknown } | undefined;
      if (body && typeof body === 'object' && 'refreshToken' in body) {
        const tokenValue = body.refreshToken;
        if (typeof tokenValue === 'string' && tokenValue.trim().length > 0) {
          bodyRefreshToken = tokenValue;
        }
      }
      
      // Determine client type: web uses cookies, mobile uses body
      const isWebClient = !!cookieRefreshToken;
      const refreshToken = cookieRefreshToken || bodyRefreshToken;
      
      if (!refreshToken) {
        logger.warn('Refresh token not found in cookies or request body');
        res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token not found',
        });
        return;
      }

      const request: RefreshTokenRequest = { refreshToken };
      const response = await this.refreshTokenUseCase.execute(request);

      if (isWebClient) {
        // WEB CLIENT: Use HTTP-only cookies only (secure, not accessible to JavaScript)
        setAccessTokenCookie(res, response.accessToken);
        
        // Update refresh token cookie if a new one was issued
        if ('refreshToken' in response && response.refreshToken) {
          const refreshTokenValue = response.refreshToken;
          if (typeof refreshTokenValue === 'string') {
            setRefreshTokenCookie(res, refreshTokenValue);
          }
        }
        
        // Security: Don't send tokens in response body for web clients
        sendSuccessResponse(res, HTTP_STATUS.OK, {
          message: 'Access token refreshed successfully',
        });
      } else {
        // MOBILE CLIENT: Send tokens in response body (needed for secure storage)
        const responseData: {
          message: string;
          accessToken: string;
          refreshToken?: string;
        } = {
          message: 'Access token refreshed successfully',
          accessToken: response.accessToken,
        };

        // Include refresh token if it's present in the response
        if ('refreshToken' in response && response.refreshToken) {
          const refreshTokenValue = response.refreshToken;
          if (typeof refreshTokenValue === 'string') {
            responseData.refreshToken = refreshTokenValue;
          }
        }

        sendSuccessResponse(res, HTTP_STATUS.OK, responseData);
      }
    } catch (error) {
      logger.error(`Error refreshing access token: ${error instanceof Error ? error.message : String(error)}`);
      sendErrorResponse(res, error);
    }
  }
}