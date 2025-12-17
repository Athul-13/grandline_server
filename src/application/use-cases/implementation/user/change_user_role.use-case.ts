import { injectable, inject } from 'tsyringe';
import { IChangeUserRoleUseCase } from '../../interface/user/change_user_role_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ChangeUserRoleRequest, ChangeUserRoleResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, UserRole } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for changing user role (admin)
 * Updates user role (USER, ADMIN)
 * Prevents demoting admin users to regular users
 */
@injectable()
export class ChangeUserRoleUseCase implements IChangeUserRoleUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: ChangeUserRoleRequest): Promise<ChangeUserRoleResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Validate role
    if (!request.role || !Object.values(UserRole).includes(request.role)) {
      throw new AppError(ERROR_MESSAGES.INVALID_USER_ROLE, ERROR_CODES.INVALID_USER_ROLE, 400);
    }

    // Find existing user
    const existingUser = await this.userRepository.findById(userId);
    
    if (!existingUser) {
      logger.warn(`Admin attempt to change role for non-existent user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Prevent demoting admin users to regular users
    if (existingUser.isAdmin() && request.role === UserRole.USER) {
      logger.warn(`Admin attempt to demote admin user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.CANNOT_BLOCK_ADMIN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Store old role for socket event
    const oldRole = existingUser.role;

    // Update role
    const updatedUser = await this.userRepository.updateUserRole(userId, request.role);

    // Emit socket event for admin dashboard
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitUserRoleChanged(updatedUser, oldRole);
    } catch (error) {
      // Don't fail role change if socket emission fails
      logger.error('Error emitting user role changed event:', error);
    }

    logger.info(`Admin changed user role: ${updatedUser.email} to ${request.role} (${userId})`);

    return UserMapper.toChangeUserRoleResponse(updatedUser);
  }
}

