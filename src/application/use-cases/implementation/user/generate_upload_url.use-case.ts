import { injectable, inject } from 'tsyringe';
import { IGenerateUploadUrlUseCase } from '../../interface/user/generate_upload_url_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { SignedUploadUrlResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { CLOUDINARY_CONFIG } from '../../../../shared/config';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Default upload configuration for profile pictures
 * Simplified: only folder needed for signed upload
 * Validation (size, format) happens on server after upload
 */
const PROFILE_PICTURE_CONFIG = {
  folder: 'profile-pictures',
};

/**
 * Use case for generating Cloudinary signed upload URL
 * Generates secure, time-limited upload parameters for authenticated users
 */
@injectable()
export class GenerateUploadUrlUseCase implements IGenerateUploadUrlUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(userId: string): Promise<SignedUploadUrlResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`Upload URL generation attempt for non-existent user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Generate signed upload parameters 
    const signedParams = this.cloudinaryService.generateSignedUploadParams({
      userId,
      folder: PROFILE_PICTURE_CONFIG.folder,
    });

    logger.info(`Generated signed upload URL for user: ${userId}`);

    return {
      uploadUrl: CLOUDINARY_CONFIG.UPLOAD_URL,
      params: {
        timestamp: signedParams.timestamp,
        signature: signedParams.signature,
        api_key: signedParams.api_key,
        folder: signedParams.folder,
      },
      expiresIn: CLOUDINARY_CONFIG.SIGNED_URL_EXPIRY,
    };
  }
}

