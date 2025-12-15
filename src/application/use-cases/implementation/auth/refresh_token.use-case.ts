import { injectable, inject } from 'tsyringe';
import { IRefreshTokenUseCase } from '../../interface/auth/refresh_token_use_case.interface';
import { RefreshTokenRequest, RefreshTokenResponse } from '../../../dtos/user.dto';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.refreshToken || typeof request.refreshToken !== 'string' || request.refreshToken.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Verify refresh token (checks blacklist, signature, expiry)
    let payload;
    try {
      payload = await this.jwtService.verifyRefreshToken(request.refreshToken);
    } catch (error) {
      // Log token verification failures (before we have user ID)
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn(`Refresh token verification failed: ${errorMessage}`);
      throw new AppError(ERROR_MESSAGES.TOKEN_EXPIRED, ERROR_CODES.AUTH_TOKEN_EXPIRED, 401);
    }

    logger.info(`Refresh token request received for ${payload.role || 'user'}: ${payload.userId}`);

    // Check role and use appropriate repository
    const isDriver = payload.role === 'driver';
    
    if (isDriver) {
      // Check if driver is still active/not blocked
      const driver = await this.driverRepository.findById(payload.userId);
      if (!driver || !driver.canLogin()) {
        logger.warn(`Refresh token request for inactive/blocked driver: ${payload.userId}`);
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }
    } else {
      // Check if user is still active/not blocked
      const user = await this.userRepository.findById(payload.userId);
      if (!user || !user.canLogin()) {
        logger.warn(`Refresh token request for inactive/blocked user: ${payload.userId}`);
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }
    }

    // Generate new access token
    const accessToken = await this.jwtService.refreshAccessToken(request.refreshToken);

    logger.info(`Access token refreshed successfully for ${payload.role || 'user'}: ${payload.userId}`);

    // Return both access token and refresh token (refresh token remains the same)
    return {
      accessToken,
      refreshToken: request.refreshToken, // Return the same refresh token
    };
  }
}

