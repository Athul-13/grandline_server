import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { ChangeDriverPasswordRequest, ChangeDriverPasswordResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { hashPassword, comparePassword } from '../../../../shared/utils/password.util';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IChangeDriverPasswordUseCase } from '../../interface/driver/change_driver_password_use_case.interface';

/**
 * Use case for changing driver password (mobile app)
 * Verifies current password and updates to new password
 * Can be used anytime (not just during onboarding)
 */
@injectable()
export class ChangeDriverPasswordUseCase implements IChangeDriverPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string, request: ChangeDriverPasswordRequest): Promise<ChangeDriverPasswordResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.currentPassword || typeof request.currentPassword !== 'string' || request.currentPassword.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    if (!request.newPassword || typeof request.newPassword !== 'string' || request.newPassword.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    // Find driver
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Change password attempt for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Get current password hash
    const currentPasswordHash = await this.driverRepository.getPasswordHash(driverId);

    // Verify current password
    const isValidPassword = await comparePassword(request.currentPassword, currentPasswordHash);
    if (!isValidPassword) {
      logger.warn(`Invalid current password attempt for driver: ${driver.email}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.INVALID_PASSWORD, 401);
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(request.newPassword);

    // Update password
    await this.driverRepository.updatePassword(driverId, newPasswordHash);

    logger.info(`Password changed for driver: ${driver.email} (${driverId})`);

    return DriverMapper.toChangeDriverPasswordResponse();
  }
}

