import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { LoginDriverRequest, LoginDriverResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { comparePassword } from '../../../../shared/utils/password.util';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ILoginDriverUseCase } from '../../interface/driver/login_driver_use_case.interface';
import { IJWTService } from '../../../../domain/services/jwt_service.interface';

/**
 * Use case for driver login (mobile app)
 * Validates credentials and generates JWT tokens
 * Drivers can login even if not onboarded, but cannot login if BLOCKED
 */
@injectable()
export class LoginDriverUseCase implements ILoginDriverUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(SERVICE_TOKENS.IJWTService)
    private readonly jwtService: IJWTService,
  ) {}

  async execute(request: LoginDriverRequest): Promise<LoginDriverResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.email || typeof request.email !== 'string' || request.email.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_EMAIL, 400);
    }

    if (!request.password || typeof request.password !== 'string' || request.password.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    // Find driver by email
    const driver = await this.driverRepository.findByEmail(request.email);
    if (!driver) {
      logger.warn(`Driver login attempt with non-existent email: ${request.email}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.DRIVER_NOT_FOUND, 401);
    }

    // Check if driver can login (not BLOCKED)
    if (!driver.canLogin()) {
      logger.warn(`Login attempt by blocked driver: ${driver.email}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.AUTH_ACCOUNT_BLOCKED, 403);
    }

    // Verify password
    const passwordHash = await this.driverRepository.getPasswordHash(driver.driverId);
    const isValidPassword = await comparePassword(request.password, passwordHash);
    if (!isValidPassword) {
      logger.warn(`Invalid password attempt for driver: ${driver.email}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.INVALID_PASSWORD, 401);
    }

    // Generate JWT tokens
    // Use userId field for consistency with JWTPayload interface (stores driverId)
    const payload = { 
      userId: driver.driverId, 
      email: driver.email, 
      role: 'driver' 
    };
    const { accessToken, refreshToken } = await this.jwtService.generateTokens(payload);

    logger.info(`Driver logged in successfully: ${driver.email}`);

    return DriverMapper.toLoginDriverResponse(driver, accessToken, refreshToken);
  }
}

