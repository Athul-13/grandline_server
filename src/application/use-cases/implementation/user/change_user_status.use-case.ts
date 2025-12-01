import { injectable, inject } from 'tsyringe';
import { IChangeUserStatusUseCase } from '../../interface/user/change_user_status_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ChangeUserStatusRequest, ChangeUserStatusResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES, UserStatus } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for changing user status (admin)
 * Updates user status (ACTIVE, BLOCKED, DELETED)
 * Admin cannot set status to INACTIVE (only users can self-delete to INACTIVE)
 * Only allows changing status for regular users (not admins)
 */
@injectable()
export class ChangeUserStatusUseCase implements IChangeUserStatusUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: ChangeUserStatusRequest): Promise<ChangeUserStatusResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Validate status
    if (!request.status || !Object.values(UserStatus).includes(request.status)) {
      throw new AppError(ERROR_MESSAGES.INVALID_USER_STATUS, ERROR_CODES.INVALID_USER_STATUS, 400);
    }

    // Prevent admin from setting status to INACTIVE
    // INACTIVE status can only be set by users when they self-delete their account
    // Admin can only set: ACTIVE, BLOCKED, or DELETED
    if (request.status === UserStatus.INACTIVE) {
      logger.warn(`Admin attempt to set status to INACTIVE for user: ${userId}`);
      throw new AppError('Admin cannot set user status to INACTIVE. Only users can self-delete their accounts.', ERROR_CODES.INVALID_USER_STATUS, 400);
    }

    // Find existing user
    const existingUser = await this.userRepository.findById(userId);
    
    if (!existingUser) {
      logger.warn(`Admin attempt to change status for non-existent user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Prevent changing status for admin users
    if (existingUser.isAdmin()) {
      logger.warn(`Admin attempt to change status for admin user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.CANNOT_BLOCK_ADMIN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Update status
    const updatedUser = await this.userRepository.updateUserStatus(userId, request.status);

    logger.info(`Admin changed user status: ${updatedUser.email} to ${request.status} (${userId})`);

    return UserMapper.toChangeUserStatusResponse(updatedUser);
  }
}

