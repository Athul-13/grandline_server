import { injectable, inject } from 'tsyringe';
import { IChangePasswordUseCase } from '../../interface/user/change_password_use_case.interface';
import { ChangePasswordRequest, ChangePasswordResponse } from '../../../dtos/user.dto';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { hashPassword, comparePassword } from '../../../../shared/utils/password.util';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { logger } from '../../../../shared/logger';

@injectable()
export class ChangePasswordUseCase implements IChangePasswordUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Check if user has a password set
    if (!user.hasPassword()) {
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    // Get current password hash
    const currentPasswordHash = await this.userRepository.getPasswordHash(user.userId);

    // Verify current password
    const isValidPassword = await comparePassword(request.currentPassword, currentPasswordHash);
    if (!isValidPassword) {
      logger.warn(`Invalid current password attempt for user: ${user.email}`);
      throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
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

