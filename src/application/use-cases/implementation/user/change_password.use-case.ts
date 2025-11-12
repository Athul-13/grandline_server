import { injectable, inject } from 'tsyringe';
import { IChangePasswordUseCase } from '../../interface/user/change_password_use_case.interface';
import { ChangePasswordRequest, ChangePasswordResponse } from '../../../dtos/user.dto';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { hashPassword, comparePassword } from '../../../../shared/utils/password.util';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

@injectable()
export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
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

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Check if user has a password set
    if (!user.hasPassword()) {
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    // Get current password hash
    const currentPasswordHash = await this.userRepository.getPasswordHash(user.userId);

    // Verify current password
    const isValidPassword = await comparePassword(request.currentPassword, currentPasswordHash);
    if (!isValidPassword) {
      logger.warn(`Invalid current password attempt for user: ${user.email}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.INVALID_PASSWORD, 401);
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(request.newPassword);

    // Update password
    await this.userRepository.updatePassword(userId, newPasswordHash);

    logger.info(`Password changed for user: ${user.email}`);

    return {
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED_SUCCESS,
    };
  }
}

