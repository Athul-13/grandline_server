import { injectable, inject } from 'tsyringe';
import { ILinkGoogleAccountUseCase } from '../../interface/auth/link_google_account_use_case.interface';
import { LinkGoogleRequest, LinkGoogleResponse } from '../../../dtos/user.dto';
import { IGoogleAuthService } from '../../../../domain/services/google_auth_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';

@injectable()
export class LinkGoogleAccountUseCase implements ILinkGoogleAccountUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IGoogleAuthService)
    private readonly googleAuthService: IGoogleAuthService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: LinkGoogleRequest): Promise<LinkGoogleResponse> {
    // Get current user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if Google account is already linked
    if (user.hasGoogleAuth()) {
      throw new Error(ERROR_MESSAGES.GOOGLE_ACCOUNT_ALREADY_LINKED);
    }

    // Verify Google ID token
    const googleUserInfo = await this.googleAuthService.verifyIdToken(request.idToken);

    // Check if Google account is already linked to another user
    const existingGoogleUser = await this.userRepository.findByGoogleId(googleUserInfo.googleId);
    if (existingGoogleUser) {
      throw new Error(ERROR_MESSAGES.GOOGLE_ACCOUNT_ALREADY_LINKED);
    }

    // Verify email matches
    if (googleUserInfo.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error(ERROR_MESSAGES.GOOGLE_EMAIL_MISMATCH);
    }

    // Link Google account
    await this.userRepository.linkGoogleAccount(userId, googleUserInfo.googleId);

    logger.info(`Google account linked for user: ${user.email}`);

    return {
      message: SUCCESS_MESSAGES.GOOGLE_ACCOUNT_LINKED,
    };
  }
}

