import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IQueueService } from '../../../../domain/services/queue_service.interface';
import { CompleteOnboardingRequest, CompleteOnboardingResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ICompleteDriverOnboardingUseCase } from '../../interface/driver/complete_driver_onboarding_use_case.interface';

/**
 * Use case for completing driver onboarding
 * Updates both license card and profile picture, then marks driver as onboarded
 */
@injectable()
export class CompleteDriverOnboardingUseCase implements ICompleteDriverOnboardingUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(SERVICE_TOKENS.IQueueService)
    private readonly queueService: IQueueService
  ) {}

  async execute(driverId: string, request: CompleteOnboardingRequest): Promise<CompleteOnboardingResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    if (!request || !request.driverLicense || !request.profilePicture) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Find driver
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Complete onboarding attempt for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Check if driver has already completed onboarding
    if (driver.isOnboarded) {
      logger.info(`Driver ${driverId} already completed onboarding`);
      return { isOnboardingComplete: true };
    }

    // Validate Cloudinary URL format
    const cloudinaryUrlPattern = /^https?:\/\/res\.cloudinary\.com\/[^/]+\/[^/]+\/[^/]+\/.+/;
    if (!cloudinaryUrlPattern.test(request.driverLicense) || !cloudinaryUrlPattern.test(request.profilePicture)) {
      throw new AppError(
        'Both license and profile picture must be valid Cloudinary URLs',
        ERROR_CODES.INVALID_REQUEST,
        400
      );
    }

    // Check if driver was already onboarded before update
    const wasOnboarded = driver.isOnboarded;

    // Update both license card and profile picture
    // Repository will auto-set isOnboarded if both photos are uploaded
    const updatedDriver = await this.driverRepository.updateDriverProfile(driverId, {
      licenseCardPhotoUrl: request.driverLicense,
      profilePictureUrl: request.profilePicture,
    });

    logger.info(
      `Onboarding completed for driver: ${driver.email} (${driverId}), isOnboarded: ${updatedDriver.isOnboarded}`
    );

    // If driver just completed onboarding, trigger pending quotes job
    if (!wasOnboarded && updatedDriver.isOnboarded) {
      try {
        await this.queueService.addProcessPendingQuotesJob();
        logger.info(`Driver ${driverId} completed onboarding, triggered pending quotes job`);
      } catch (error) {
        logger.warn(
          `Failed to trigger pending quotes job after driver ${driverId} onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        // Don't fail onboarding completion if queue job fails
      }
    }

    return { isOnboardingComplete: updatedDriver.isOnboarded };
  }
}

