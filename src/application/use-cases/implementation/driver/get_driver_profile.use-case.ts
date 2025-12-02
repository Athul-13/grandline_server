import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { GetDriverProfileResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { IGetDriverProfileUseCase } from '../../interface/driver/get_driver_profile_use_case.interface';

/**
 * Use case for getting driver profile (mobile app)
 * Returns driver profile information with onboarding progress
 */
@injectable()
export class GetDriverProfileUseCase implements IGetDriverProfileUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string): Promise<GetDriverProfileResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    // Find driver
    const driver = await this.driverRepository.findById(driverId);
    if (!driver) {
      logger.warn(`Get profile attempt for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    logger.info(`Profile fetched for driver: ${driver.email} (${driverId})`);

    return DriverMapper.toGetDriverProfileResponse(driver);
  }
}

