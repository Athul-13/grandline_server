import { injectable, inject } from 'tsyringe';
import { ILogoutUserUseCase } from '../../interface/auth/logout_user_use_case.interface';
import { LogoutUserRequest, LogoutUserResponse } from '../../../dtos/user.dto';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { SERVICE_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { UserMapper } from '../../../mapper/user.mapper';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class LogoutUserUseCase implements ILogoutUserUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService
  ) {}

  async execute(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (request.refreshToken) {
      try {
        await this.jwtService.revokeRefreshToken(request.refreshToken);
        logger.info('Refresh token blacklisted during logout');
      } catch {
        // If token is invalid/expired, still proceed with logout
        logger.warn('Failed to blacklist refresh token during logout, proceeding anyway');
      }
    }

    return UserMapper.toLogoutResponse();
  }
}

