import { injectable, inject } from 'tsyringe';
import { v4 as uuidv4 } from 'uuid';
import { ICreateDriverUseCase } from '../../interface/driver/create_driver_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { CreateDriverRequest, CreateDriverResponse } from '../../../dtos/driver.dto';
import { Driver } from '../../../../domain/entities/driver.entity';
import { DriverStatus, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { hashPassword } from '../../../../shared/utils/password.util';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for creating a driver
 * Admin creates driver account with credentials
 */
@injectable()
export class CreateDriverUseCase implements ICreateDriverUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(request: CreateDriverRequest): Promise<CreateDriverResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.fullName || typeof request.fullName !== 'string' || request.fullName.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.email || typeof request.email !== 'string' || request.email.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_EMAIL, 400);
    }

    if (!request.password || typeof request.password !== 'string' || request.password.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    if (!request.licenseNumber || typeof request.licenseNumber !== 'string' || request.licenseNumber.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (request.salary === undefined || request.salary === null || typeof request.salary !== 'number' || request.salary < 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check for existing driver with same email
    const existingByEmail = await this.driverRepository.findByEmail(request.email.trim().toLowerCase());
    if (existingByEmail) {
      logger.warn(`Attempt to create driver with duplicate email: ${request.email}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_EMAIL_ALREADY_EXISTS, ERROR_CODES.DRIVER_DUPLICATE_EMAIL, 409);
    }

    // Check for existing driver with same license number
    // Note: We need to add a findByLicenseNumber method or check in findDriversWithFilters
    const driversWithLicense = await this.driverRepository.findDriversWithFilters({
      search: request.licenseNumber.trim(),
    });
    const existingByLicense = driversWithLicense.drivers.find(
      d => d.licenseNumber.toLowerCase() === request.licenseNumber.trim().toLowerCase()
    );
    if (existingByLicense) {
      logger.warn(`Attempt to create driver with duplicate license number: ${request.licenseNumber}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_LICENSE_NUMBER_EXISTS, ERROR_CODES.DRIVER_DUPLICATE_LICENSE, 409);
    }

    // Generate driver ID
    const driverId = uuidv4();
    const now = new Date();

    // Hash password
    const passwordHash = await hashPassword(request.password);

    // Store plain password for response (only returned at creation)
    const plainPassword = request.password;

    // Create driver entity
    const driver = new Driver(
      driverId,
      request.fullName.trim(),
      '', // profilePictureUrl - empty initially
      request.email.trim().toLowerCase(),
      request.phoneNumber?.trim() || '',
      passwordHash, // This will be stored separately
      request.licenseNumber.trim(),
      '', // licenseCardPhotoUrl - empty initially
      DriverStatus.AVAILABLE, // Initial status: AVAILABLE (will change to OFFLINE later)
      request.salary,
      0, // totalEarnings - 0 initially
      false, // isOnboarded - false initially
      now,
      now
    );

    // Save to repository
    await this.driverRepository.createDriver(driver, passwordHash);

    // Emit socket event for admin dashboard
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitDriverCreated(driver);
    } catch (error) {
      // Don't fail driver creation if socket emission fails
      logger.error('Error emitting driver created event:', error);
    }

    logger.info(`Driver created successfully: ${driver.email} (${driverId})`);

    // Return response with plain password
    return DriverMapper.toCreateDriverResponse(driver, plainPassword);
  }
}

