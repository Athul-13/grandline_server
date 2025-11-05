import { injectable, inject } from 'tsyringe';
import { IRefreshTokenUseCase } from '../../interface/auth/refresh_token_use_case.interface';
import { RefreshTokenRequest, RefreshTokenResponse } from '../../../dtos/user.dto';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';

@injectable()
export class RefreshTokenUseCase implements IRefreshTokenUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // Verify refresh token (checks blacklist, signature, expiry)
    const payload = await this.jwtService.verifyRefreshToken(request.refreshToken);

    // Check if user is still active/not blocked
    const user = await this.userRepository.findById(payload.userId);
    if (!user || !user.canLogin()) {
      throw new Error(ERROR_MESSAGES.FORBIDDEN);
    }

    // Generate new access token
    const accessToken = await this.jwtService.refreshAccessToken(request.refreshToken);

    return {
      accessToken,
    };
  }
}

