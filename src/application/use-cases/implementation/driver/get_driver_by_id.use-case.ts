import { injectable, inject } from 'tsyringe';
import { IGetDriverByIdUseCase } from '../../interface/driver/get_driver_by_id_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { GetDriverByIdResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting driver by ID (admin)
 * Retrieves driver details for admin view
 */
@injectable()
export class GetDriverByIdUseCase implements IGetDriverByIdUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string): Promise<GetDriverByIdResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    const driver = await this.driverRepository.findById(driverId);
    
    if (!driver) {
      logger.warn(`Admin attempt to view non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    logger.info(`Admin viewed driver: ${driver.email}`);

    return DriverMapper.toGetDriverByIdResponse(driver);
  }
}

