import { injectable, inject } from 'tsyringe';
import { IGenerateDriverUploadUrlUseCase } from '../../interface/driver/generate_driver_upload_url_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { SignedUploadUrlResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { CLOUDINARY_CONFIG } from '../../../../shared/config';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Default upload configuration for driver profile pictures and license cards
 * Simplified: only folder needed for signed upload
 * Validation (size, format) happens on server after upload
 */
const DRIVER_UPLOAD_CONFIG = {
  folder: 'driver-uploads',
};

/**
 * Use case for generating Cloudinary signed upload URL for drivers
 * Generates secure, time-limited upload parameters for authenticated drivers
 */
@injectable()
export class GenerateDriverUploadUrlUseCase implements IGenerateDriverUploadUrlUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(driverId: string): Promise<SignedUploadUrlResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    // Check if driver exists
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Upload URL generation attempt for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Generate signed upload parameters 
    const signedParams = this.cloudinaryService.generateSignedUploadParams({
      userId: driverId,
      folder: DRIVER_UPLOAD_CONFIG.folder,
    });

    logger.info(`Generated signed upload URL for driver: ${driverId}`);

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

