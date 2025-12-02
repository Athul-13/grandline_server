import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { UpdateOnboardingPasswordRequest, UpdateOnboardingPasswordResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { hashPassword } from '../../../../shared/utils/password.util';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IUpdateOnboardingPasswordUseCase } from '../../interface/driver/update_onboarding_password_use_case.interface';

/**
 * Use case for updating driver password during onboarding (mobile app)
 * Optional password change during onboarding
 * Can skip (keep admin-provided password)
 */
@injectable()
export class UpdateOnboardingPasswordUseCase implements IUpdateOnboardingPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string, request: UpdateOnboardingPasswordRequest): Promise<UpdateOnboardingPasswordResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    if (!request || !request.newPassword) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Find driver
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Update onboarding password attempt for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(request.newPassword);

    // Update password
    await this.driverRepository.updatePassword(driverId, newPasswordHash);

    logger.info(`Onboarding password updated for driver: ${driver.email} (${driverId})`);

    return DriverMapper.toUpdateOnboardingPasswordResponse();
  }
}

