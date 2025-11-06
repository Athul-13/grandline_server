import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { IGoogleAuthUseCase } from '../../interface/auth/google_auth_use_case.interface';
import { GoogleAuthRequest, GoogleAuthResponse } from '../../../dtos/user.dto';
import { IGoogleAuthService } from '../../../../domain/services/google_auth_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';
import { User } from '../../../../domain/entities/user.entity';
import { UserRole, UserStatus, ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';

@injectable()
export class GoogleAuthUseCase implements IGoogleAuthUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IGoogleAuthService)
    private readonly googleAuthService: IGoogleAuthService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService,
  ) {}

  async execute(request: GoogleAuthRequest): Promise<GoogleAuthResponse> {
    // Verify Google ID token
    const googleUserInfo = await this.googleAuthService.verifyIdToken(request.idToken);

    // Check if user exists by Google ID
    let user = await this.userRepository.findByGoogleId(googleUserInfo.googleId);

    if (user) {
      // User exists with Google auth - login
      if (!user.canLogin()) {
        logger.warn(`Login attempt by blocked/inactive user: ${user.email}`);
        throw new Error(ERROR_MESSAGES.FORBIDDEN);
      }

      const payload = { userId: user.userId, email: user.email, role: user.role };
      const { accessToken, refreshToken } = await this.jwtService.generateTokens(payload);

      logger.info(`User logged in with Google: ${user.email}`);
      return UserMapper.toLoginResponse(user, accessToken, refreshToken);
    }

    // Check if user exists by email (credential account)
    const existingUser = await this.userRepository.findByEmail(googleUserInfo.email);
    if (existingUser) {
      // Account exists with credentials - cannot auto-link
      logger.warn(`Google sign-in attempted on existing credential account: ${googleUserInfo.email}`);
      throw new Error(ERROR_MESSAGES.ACCOUNT_ALREADY_EXISTS);
    }

    // New user - create account
    const userId = uuidv4();
    user = new User(
      userId,
      googleUserInfo.name,
      googleUserInfo.email,
      UserRole.USER,
      UserStatus.ACTIVE,
      googleUserInfo.picture || '',
      true, // Google accounts are verified
      new Date(),
      new Date(),
      undefined, // phoneNumber optional
      undefined, // password optional
      googleUserInfo.googleId
    );

    await this.userRepository.createUser(user);

    const payload = { userId: user.userId, email: user.email, role: user.role };
    const { accessToken, refreshToken } = await this.jwtService.generateTokens(payload);

    logger.info(`New user registered with Google: ${user.email}`);

    return UserMapper.toLoginResponse(user, accessToken, refreshToken);
  }
}

