import { injectable, inject } from 'tsyringe';
import { IUpdateUserProfileUseCase } from '../../interface/user/update_user_profile_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { UpdateUserProfileRequest, UpdateUserProfileResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { UserMapper } from '../../../mapper/user.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for updating user profile
 * Updates user profile fields (name, phone, profile picture)
 */
@injectable()
export class UpdateUserProfileUseCase implements IUpdateUserProfileUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(userId: string, request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      logger.warn(`Profile update attempt for non-existent user: ${userId}`);
      throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    // Build update object (only include defined fields)
    const updates: { fullName?: string; phoneNumber?: string; profilePicture?: string } = {};
    
    if (request.fullName !== undefined) {
      updates.fullName = request.fullName;
    }
    if (request.phoneNumber !== undefined) {
      updates.phoneNumber = request.phoneNumber;
    }
    if (request.profilePicture !== undefined) {
      updates.profilePicture = request.profilePicture;
    }

    // Check if there are any updates to make
    if (Object.keys(updates).length === 0) {
      logger.warn(`Profile update attempt with no changes for user: ${userId}`);
      throw new Error(ERROR_MESSAGES.BAD_REQUEST);
    }

    // Update user profile
    const updatedUser = await this.userRepository.updateUserProfile(userId, updates);

    const updatedFields = Object.keys(updates);
    logger.info(`User profile updated successfully: ${updatedUser.email}, fields updated: ${updatedFields.join(', ')}`);

    const response = UserMapper.toUpdateUserProfileResponse(updatedUser);
    response.message = SUCCESS_MESSAGES.PROFILE_UPDATED;
    
    return response;
  }
}

