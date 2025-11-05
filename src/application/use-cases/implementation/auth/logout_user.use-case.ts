import { injectable, inject } from 'tsyringe';
import { ILogoutUserUseCase } from '../../interface/auth/logout_user_use_case.interface';
import { LogoutUserRequest, LogoutUserResponse } from '../../../dtos/user.dto';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';
import { UserMapper } from '../../../mapper/user.mapper';

@injectable()
export class LogoutUserUseCase implements ILogoutUserUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService
  ) {}

  async execute(request: LogoutUserRequest): Promise<LogoutUserResponse> {
    if (request.refreshToken) {
      try {
        await this.jwtService.revokeRefreshToken(request.refreshToken);
        logger.info('Refresh token blacklisted during logout');
      } catch (error) {
        // If token is invalid/expired, still proceed with logout
        logger.warn('Failed to blacklist refresh token during logout, proceeding anyway');
      }
    }

    return UserMapper.toLogoutResponse();
  }
}

