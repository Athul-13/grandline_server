import { injectable, inject } from 'tsyringe';
import { IGenerateUploadUrlUseCase } from '../../interface/user/generate_upload_url_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { SignedUploadUrlResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { CLOUDINARY_CONFIG } from '../../../../shared/config';
import { logger } from '../../../../shared/logger';

/**
 * Default upload configuration for profile pictures
 * Can be extended for other upload types (vehicles, etc.)
 */
const PROFILE_PICTURE_CONFIG = {
  folder: 'profile-pictures',
  maxFileSize: 5242880, // 5MB
  allowedFormats: ['jpg', 'png', 'webp'] as string[],
  transformations: [
    {
      width: 500,
      height: 500,
      crop: 'fill',
      gravity: 'face',
      quality: 'auto',
    },
  ] as Array<{ width: number; height: number; crop: string; gravity: string; quality: string }>,
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
    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`Upload URL generation attempt for non-existent user: ${userId}`);
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Generate signed upload parameters with profile picture defaults
    // Future: Can create separate use cases for different upload types (vehicles, etc.)
    const signedParams = this.cloudinaryService.generateSignedUploadParams({
      userId,
      folder: PROFILE_PICTURE_CONFIG.folder,
      maxFileSize: PROFILE_PICTURE_CONFIG.maxFileSize,
      allowedFormats: PROFILE_PICTURE_CONFIG.allowedFormats,
      transformations: PROFILE_PICTURE_CONFIG.transformations,
    });

    logger.info(`Generated signed upload URL for user: ${userId}`);

    return {
      uploadUrl: CLOUDINARY_CONFIG.UPLOAD_URL,
      params: {
        timestamp: signedParams.timestamp,
        signature: signedParams.signature,
        api_key: signedParams.api_key,
        folder: signedParams.folder,
        allowed_formats: signedParams.allowed_formats,
        max_file_size: signedParams.max_file_size,
        transformation: signedParams.transformation,
      },
      expiresIn: CLOUDINARY_CONFIG.SIGNED_URL_EXPIRY,
    };
  }
}

