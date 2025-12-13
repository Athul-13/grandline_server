import { injectable, inject } from 'tsyringe';
import { IResetDriverPasswordUseCase } from '../../interface/driver/reset_driver_password_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { ResetDriverPasswordRequest, ResetDriverPasswordResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { APP_CONFIG } from '../../../../shared/config';
import jwt, { Secret } from 'jsonwebtoken';
import { hashPassword } from '../../../../shared/utils/password.util';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * JWT payload for driver password reset tokens
 */
interface DriverPasswordResetTokenPayload {
  userId: string;
  email: string;
  role?: string;
  type?: string;
  iat?: number;
  exp?: number;
}

/**
 * Use case for handling driver password reset
 * Validates the reset token and updates the driver's password
 */
@injectable()
export class ResetDriverPasswordUseCase implements IResetDriverPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(request: ResetDriverPasswordRequest): Promise<ResetDriverPasswordResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.token || typeof request.token !== 'string' || request.token.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_TOKEN, 400);
    }

    if (!request.newPassword || typeof request.newPassword !== 'string' || request.newPassword.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    const secret: Secret = APP_CONFIG.JWT_SECRET;

    // Verify and decode the reset token
    let decoded: DriverPasswordResetTokenPayload;
    try {
      decoded = jwt.verify(request.token, secret) as DriverPasswordResetTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Driver password reset attempt with expired token');
        throw new AppError(ERROR_MESSAGES.TOKEN_EXPIRED, ERROR_CODES.AUTH_TOKEN_EXPIRED, 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Driver password reset attempt with invalid token');
        throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
      }
      throw error;
    }

    // Verify token type (optional extra security)
    if (decoded.type !== 'password_reset') {
      logger.warn(`Invalid token type for driver password reset: ${decoded.type}`);
      throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Verify role is driver
    if (decoded.role !== 'driver') {
      logger.warn(`Invalid role in driver password reset token: ${decoded.role}`);
      throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Find driver by driverId from token
    const driver = await this.driverRepository.findById(decoded.userId);
    if (!driver) {
      logger.warn(`Password reset attempt for non-existent driver: ${decoded.userId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Verify email matches (extra validation)
    if (driver.email !== decoded.email) {
      logger.warn(`Email mismatch in driver password reset token for driver: ${decoded.userId}`);
      throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Hash the new password
    const passwordHash = await hashPassword(request.newPassword);

    // Update password in database
    await this.driverRepository.updatePassword(driver.driverId, passwordHash);

    logger.info(`Password reset successfully for driver: ${driver.email}`);

    return {
      message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS,
    };
  }
}

