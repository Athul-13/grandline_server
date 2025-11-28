import { injectable, inject } from 'tsyringe';
import { IGetUserByIdUseCase } from '../../interface/user/get_user_by_id_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetUserByIdResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting user by ID (admin)
 * Retrieves user details for admin view
 * Only allows viewing regular users (not admins)
 */
@injectable()
export class GetUserByIdUseCase implements IGetUserByIdUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<GetUserByIdResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.warn(`Admin attempt to view non-existent user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
    }

    // Prevent viewing admin users
    if (user.isAdmin()) {
      logger.warn(`Admin attempt to view admin user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    logger.info(`Admin viewed user: ${user.email}`);

    return UserMapper.toGetUserByIdResponse(user);
  }
}

