import { injectable, inject } from 'tsyringe';
import { IUpdateDriverUseCase } from '../../interface/driver/update_driver_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { UpdateDriverRequest, UpdateDriverResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for updating driver details (admin)
 * Updates driver information: fullName, email, phoneNumber, licenseNumber, salary
 * Cannot update password through this endpoint
 */
@injectable()
export class UpdateDriverUseCase implements IUpdateDriverUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string, request: UpdateDriverRequest): Promise<UpdateDriverResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request || Object.keys(request).length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check if driver exists
    const existingDriver = await this.driverRepository.findById(driverId);
    if (!existingDriver) {
      logger.warn(`Admin attempt to update non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Check for email uniqueness if email is being updated
    if (request.email && request.email.trim() !== existingDriver.email) {
      const driverWithEmail = await this.driverRepository.findByEmail(request.email.trim().toLowerCase());
      if (driverWithEmail && driverWithEmail.driverId !== driverId) {
        logger.warn(`Attempt to update driver with duplicate email: ${request.email}`);
        throw new AppError(ERROR_MESSAGES.DRIVER_EMAIL_ALREADY_EXISTS, ERROR_CODES.DRIVER_DUPLICATE_EMAIL, 409);
      }
    }

    // Check for license number uniqueness if license number is being updated
    if (request.licenseNumber && request.licenseNumber.trim() !== existingDriver.licenseNumber) {
      const driversWithLicense = await this.driverRepository.findDriversWithFilters({
        search: request.licenseNumber.trim(),
      });
      const driverWithLicense = driversWithLicense.drivers.find(
        d => d.licenseNumber.toLowerCase() === request.licenseNumber.trim().toLowerCase() && d.driverId !== driverId
      );
      if (driverWithLicense) {
        logger.warn(`Attempt to update driver with duplicate license number: ${request.licenseNumber}`);
        throw new AppError(ERROR_MESSAGES.DRIVER_LICENSE_NUMBER_EXISTS, ERROR_CODES.DRIVER_DUPLICATE_LICENSE, 409);
      }
    }

    // Prepare update object
    const updates: {
      fullName?: string;
      email?: string;
      phoneNumber?: string;
      licenseNumber?: string;
      salary?: number;
    } = {};

    if (request.fullName !== undefined) {
      updates.fullName = request.fullName.trim();
    }

    if (request.email !== undefined) {
      updates.email = request.email.trim().toLowerCase();
    }

    if (request.phoneNumber !== undefined) {
      updates.phoneNumber = request.phoneNumber.trim() || '';
    }

    if (request.licenseNumber !== undefined) {
      updates.licenseNumber = request.licenseNumber.trim();
    }

    if (request.salary !== undefined) {
      if (request.salary < 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
      }
      updates.salary = request.salary;
    }

    // Update driver profile
    const updatedDriver = await this.driverRepository.updateDriverProfile(driverId, updates);

    logger.info(`Driver updated successfully: ${updatedDriver.email} (${driverId})`);

    return DriverMapper.toUpdateDriverResponse(updatedDriver);
  }
}

