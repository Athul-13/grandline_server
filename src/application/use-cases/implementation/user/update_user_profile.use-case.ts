import { injectable, inject } from 'tsyringe';
import { IUpdateUserProfileUseCase } from '../../interface/user/update_user_profile_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { UpdateUserProfileRequest, UpdateUserProfileResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { CLOUDINARY_CONFIG } from '../../../../shared/config';
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
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
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
      // Validate Cloudinary URL format (simple regex check)
      if (!this.isValidCloudinaryUrl(request.profilePicture)) {
        logger.warn(`Invalid profile picture URL format for user: ${userId}`);
        throw new Error('Invalid profile picture URL format');
      }

      // Verify file exists in Cloudinary
      const fileExists = await this.cloudinaryService.verifyFileExists(request.profilePicture);
      if (!fileExists) {
        logger.warn(`Profile picture file not found in Cloudinary for user: ${userId}`);
        throw new Error('Profile picture file not found in Cloudinary');
      }

      // Delete old profile picture if it exists
      if (existingUser.profilePicture && existingUser.profilePicture !== request.profilePicture) {
        try {
          await this.cloudinaryService.deleteFile(existingUser.profilePicture);
          logger.info(`Deleted old profile picture for user: ${userId}`);
        } catch (error) {
          // Log but don't fail - old file might already be deleted
          logger.warn(`Failed to delete old profile picture for user ${userId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

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

  /**
   * Validates Cloudinary URL format
   * Simple validation - can be extended for more complex checks if needed
   */
  private isValidCloudinaryUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      
      // Must be HTTPS
      if (urlObj.protocol !== 'https:') {
        return false;
      }

      // Must be Cloudinary domain
      if (!urlObj.hostname.includes('cloudinary.com') && !urlObj.hostname.includes('res.cloudinary.com')) {
        return false;
      }

      // Must contain cloud name in path
      if (!urlObj.pathname.includes(CLOUDINARY_CONFIG.CLOUD_NAME)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}

