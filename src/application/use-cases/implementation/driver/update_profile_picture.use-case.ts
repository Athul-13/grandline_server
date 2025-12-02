import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { UpdateProfilePictureRequest, UpdateProfilePictureResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IUpdateProfilePictureUseCase } from '../../interface/driver/update_profile_picture_use_case.interface';

/**
 * Use case for updating driver profile picture (mobile app - onboarding)
 * Validates Cloudinary URL format
 * Auto-sets isOnboarded: true if both photos uploaded
 * Driver cannot update profile picture after onboarding is complete
 */
@injectable()
export class UpdateProfilePictureUseCase implements IUpdateProfilePictureUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string, request: UpdateProfilePictureRequest): Promise<UpdateProfilePictureResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    if (!request || !request.profilePictureUrl) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Find driver
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Update profile picture attempt for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

      // Check if driver has already completed onboarding
      // Driver cannot update profile picture after onboarding is complete
      if (driver.isOnboarded && driver.profilePictureUrl !== '') {
        logger.warn(`Update profile picture attempt for already onboarded driver: ${driverId}`);
        throw new AppError(
          'Profile picture cannot be updated after onboarding is complete',
          ERROR_CODES.INVALID_REQUEST,
          400
        );
      }

      // Validate Cloudinary URL format (already validated by DTO, but double-check)
      const cloudinaryUrlPattern = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/;
      if (!cloudinaryUrlPattern.test(request.profilePictureUrl)) {
        throw new AppError(
          'Profile picture must be a valid Cloudinary URL',
          ERROR_CODES.INVALID_REQUEST,
          400
        );
      }

    // Update profile picture
    // Repository will auto-set isOnboarded if both photos are uploaded
    const updatedDriver = await this.driverRepository.updateDriverProfile(driverId, {
      profilePictureUrl: request.profilePictureUrl,
    });

    logger.info(`Profile picture updated for driver: ${driver.email} (${driverId}), isOnboarded: ${updatedDriver.isOnboarded}`);

    return DriverMapper.toUpdateProfilePictureResponse(updatedDriver);
  }
}

