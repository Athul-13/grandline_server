import { injectable, inject } from 'tsyringe';
import { IDeleteUserAccountUseCase } from '../../interface/user/delete_user_account_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { DeleteUserAccountRequest, DeleteUserAccountResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { comparePassword } from '../../../../shared/utils/password.util';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for deleting user account (self-service)
 * Soft deletes user account after password verification
 */
@injectable()
export class DeleteUserAccountUseCase implements IDeleteUserAccountUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: DeleteUserAccountRequest): Promise<DeleteUserAccountResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.password || typeof request.password !== 'string' || request.password.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_PASSWORD, 400);
    }

    // Find user
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.warn(`Delete account attempt for non-existent user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Verify password
    if (!user.hasPassword()) {
      logger.warn(`Delete account attempt for user without password: ${userId}`);
      throw new AppError('Password verification required. Please set a password first.', ERROR_CODES.FORBIDDEN, 403);
    }

    const passwordHash = await this.userRepository.getPasswordHash(userId);
    const isPasswordValid = await comparePassword(request.password, passwordHash);

    if (!isPasswordValid) {
      logger.warn(`Delete account attempt with invalid password: ${userId}`);
      throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, ERROR_CODES.INVALID_PASSWORD, 401);
    }

    // Soft delete user account
    await this.userRepository.softDelete(userId);

    // Emit socket event for admin dashboard
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitUserDeleted(userId);
    } catch (error) {
      // Don't fail account deletion if socket emission fails
      logger.error('Error emitting user deleted event:', error);
    }

    logger.info(`User account deleted (soft): ${user.email} (${userId})`);

    return {
      message: SUCCESS_MESSAGES.USER_DELETED,
    };
  }
}

