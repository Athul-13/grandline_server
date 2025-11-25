import { injectable, inject } from 'tsyringe';
import { IResetPasswordUseCase } from '../../interface/auth/reset_password_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ResetPasswordRequest, ResetPasswordResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { APP_CONFIG } from '../../../../shared/config';
import jwt, { Secret } from 'jsonwebtoken';
import { hashPassword } from '../../../../shared/utils/password.util';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * JWT payload for password reset tokens
 */
interface PasswordResetTokenPayload {
  userId: string;
  email: string;
  type?: string;
  iat?: number;
  exp?: number;
}

/**
 * Use case for handling password reset
 * Validates the reset token and updates the user's password
 */
@injectable()
export class ResetPasswordUseCase implements IResetPasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
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
    let decoded: PasswordResetTokenPayload;
    try {
      decoded = jwt.verify(request.token, secret) as PasswordResetTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        logger.warn('Password reset attempt with expired token');
        throw new AppError(ERROR_MESSAGES.TOKEN_EXPIRED, ERROR_CODES.AUTH_TOKEN_EXPIRED, 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        logger.warn('Password reset attempt with invalid token');
        throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
      }
      throw error;
    }

    // Verify token type (optional extra security)
    if (decoded.type !== 'password_reset') {
      logger.warn(`Invalid token type for password reset: ${decoded.type}`);
      throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Find user by userId from token
    const user = await this.userRepository.findById(decoded.userId);
    if (!user) {
      logger.warn(`Password reset attempt for non-existent user: ${decoded.userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Verify email matches (extra validation)
    if (user.email !== decoded.email) {
      logger.warn(`Email mismatch in password reset token for user: ${decoded.userId}`);
      throw new AppError(ERROR_MESSAGES.INVALID_RESET_TOKEN, ERROR_CODES.INVALID_TOKEN, 400);
    }

    // Hash the new password
    const passwordHash = await hashPassword(request.newPassword);

    // Update password in database
    await this.userRepository.updatePassword(user.userId, passwordHash);

    logger.info(`Password reset successfully for user: ${user.email}`);

    return UserMapper.toResetPasswordResponse();
  }
}

