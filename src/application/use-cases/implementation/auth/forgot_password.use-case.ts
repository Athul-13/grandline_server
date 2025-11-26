import { injectable, inject } from 'tsyringe';
import { IForgotPasswordUseCase } from '../../interface/auth/forgot_password_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { ForgotPasswordRequest, ForgotPasswordResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { EmailType, PasswordResetEmailData } from '../../../../shared/types/email.types';
import { APP_CONFIG, JWT_CONFIG, FRONTEND_CONFIG } from '../../../../shared/config';
import jwt, { Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for handling forgot password requests
 * Generates a password reset token and sends it via email
 */
@injectable()
export class ForgotPasswordUseCase implements IForgotPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
  ) {}

  async execute(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.email || typeof request.email !== 'string' || request.email.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_EMAIL, 400);
    }

    const user = await this.userRepository.findByEmail(request.email);
    
    // Always return success to prevent email enumeration attacks
    // But only send email if user exists
    if (!user) {
      logger.warn(`Forgot password request for non-existent email: ${request.email}`);
      // Return success response without user data to prevent email enumeration
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
        email: request.email,
      };
    }

    // Generate password reset token
    const secret: Secret = APP_CONFIG.JWT_SECRET;
    const payload = {
      userId: user.userId,
      email: user.email,
      type: 'password_reset', // Add type to distinguish from other tokens
    };

    const resetToken = jwt.sign(
      payload,
      secret,
      {
        expiresIn: JWT_CONFIG.RESET_PASSWORD_TOKEN_EXPIRY as StringValue, // 5 minutes
      }
    );

    // Construct reset link
    const resetLink = `${FRONTEND_CONFIG.URL}/reset-password?token=${resetToken}`;

    // Send password reset email
    const emailData: PasswordResetEmailData = {
      email: user.email,
      resetLink,
      fullName: user.fullName,
      expiryMinutes: 5, // 5 minutes
    };

    await this.emailService.sendEmail(EmailType.PASSWORD_RESET, emailData);

    logger.info(`Password reset email sent to: ${user.email}`);

    return UserMapper.toForgotPasswordResponse(user);
  }
}

