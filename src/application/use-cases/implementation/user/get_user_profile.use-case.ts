import { injectable, inject } from 'tsyringe';
import { IGetUserProfileUseCase } from '../../interface/user/get_user_profile_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { GetUserProfileResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting user profile
 * Retrieves the current user's profile information
 */
@injectable()
export class GetUserProfileUseCase implements IGetUserProfileUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string): Promise<GetUserProfileResponse> {
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      logger.warn(`Profile fetch attempt for non-existent user: ${userId}`);
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    logger.info(`User profile fetched: ${user.email}`);

    return UserMapper.toGetUserProfileResponse(user);
  }
}

