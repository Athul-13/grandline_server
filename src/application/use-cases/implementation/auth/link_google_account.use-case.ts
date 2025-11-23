import { injectable, inject } from 'tsyringe';
import { ILinkGoogleAccountUseCase } from '../../interface/auth/link_google_account_use_case.interface';
import { LinkGoogleRequest, LinkGoogleResponse } from '../../../dtos/user.dto';
import { IGoogleAuthService } from '../../../../domain/services/google_auth_service.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { SERVICE_TOKENS, REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class LinkGoogleAccountUseCase implements ILinkGoogleAccountUseCase {
  constructor(
    @inject(SERVICE_TOKENS.IGoogleAuthService)
    private readonly googleAuthService: IGoogleAuthService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: LinkGoogleRequest): Promise<LinkGoogleResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.idToken || typeof request.idToken !== 'string' || request.idToken.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Get current user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Check if Google account is already linked
    if (user.hasGoogleAuth()) {
      throw new AppError(ERROR_MESSAGES.GOOGLE_ACCOUNT_ALREADY_LINKED, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Verify Google ID token
    const googleUserInfo = await this.googleAuthService.verifyIdToken(request.idToken);

    // Check if Google account is already linked to another user
    const existingGoogleUser = await this.userRepository.findByGoogleId(googleUserInfo.googleId);
    if (existingGoogleUser) {
      throw new AppError(ERROR_MESSAGES.GOOGLE_ACCOUNT_ALREADY_LINKED, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Verify email matches
    if (googleUserInfo.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new AppError(ERROR_MESSAGES.GOOGLE_EMAIL_MISMATCH, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Link Google account
    await this.userRepository.linkGoogleAccount(userId, googleUserInfo.googleId);

    logger.info(`Google account linked for user: ${user.email}`);

    return {
      message: SUCCESS_MESSAGES.GOOGLE_ACCOUNT_LINKED,
    };
  }
}

