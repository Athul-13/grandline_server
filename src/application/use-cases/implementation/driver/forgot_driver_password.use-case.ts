import { injectable, inject } from 'tsyringe';
import { IForgotDriverPasswordUseCase } from '../../interface/driver/forgot_driver_password_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { ForgotDriverPasswordRequest, ForgotDriverPasswordResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { EmailType, PasswordResetEmailData } from '../../../../shared/types/email.types';
import { APP_CONFIG, JWT_CONFIG, MOBILE_CONFIG } from '../../../../shared/config';
import jwt, { Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for handling driver forgot password requests
 * Generates a password reset token and sends it via email with deep link
 */
@injectable()
export class ForgotDriverPasswordUseCase implements IForgotDriverPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
  ) {}

  async execute(request: ForgotDriverPasswordRequest): Promise<ForgotDriverPasswordResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.email || typeof request.email !== 'string' || request.email.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_EMAIL, 400);
    }

    const driver = await this.driverRepository.findByEmail(request.email);
    
    // Always return success to prevent email enumeration attacks
    // But only send email if driver exists
    if (!driver) {
      logger.warn(`Driver forgot password request for non-existent email: ${request.email}`);
      // Return success response without driver data to prevent email enumeration
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
        email: request.email,
      };
    }

    // Generate password reset token
    const secret: Secret = APP_CONFIG.JWT_SECRET;
    const payload = {
      userId: driver.driverId,
      email: driver.email,
      role: 'driver',
      type: 'password_reset', // Add type to distinguish from other tokens
    };

    const resetToken = jwt.sign(
      payload,
      secret,
      {
        expiresIn: JWT_CONFIG.RESET_PASSWORD_TOKEN_EXPIRY as StringValue, // 5 minutes
      }
    );

    // Construct deep link for mobile app (not web link)
    const resetLink = `${MOBILE_CONFIG.DEEP_LINK_BASE}?token=${resetToken}`;

    // Send password reset email with deep link
    const emailData: PasswordResetEmailData = {
      email: driver.email,
      resetLink,
      fullName: driver.fullName,
      expiryMinutes: 5, // 5 minutes
    };

    await this.emailService.sendEmail(EmailType.PASSWORD_RESET, emailData);

    logger.info(`Password reset email sent to driver: ${driver.email}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
      email: request.email,
    };
  }
}

