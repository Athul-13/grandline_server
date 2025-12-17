import { injectable, inject } from 'tsyringe';
import { IUpdateUserProfileUseCase } from '../../interface/user/update_user_profile_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { UpdateUserProfileRequest, UpdateUserProfileResponse } from '../../../dtos/user.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { CLOUDINARY_CONFIG } from '../../../../shared/config';
import { UserMapper } from '../../../mapper/user.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

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
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_USER_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      logger.warn(`Profile update attempt for non-existent user: ${userId}`);
      throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, ERROR_CODES.USER_NOT_FOUND, 404);
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
        throw new AppError('Invalid profile picture URL format', ERROR_CODES.INVALID_REQUEST, 400);
      }

      // Verify file exists in Cloudinary
      const fileExists = await this.cloudinaryService.verifyFileExists(request.profilePicture);
      if (!fileExists) {
        logger.warn(`Profile picture file not found in Cloudinary for user: ${userId}`);
        throw new AppError('Profile picture file not found in Cloudinary', ERROR_CODES.INVALID_REQUEST, 404);
      }

      // Validate file size and format (server-side validation)
      const fileInfo = await this.cloudinaryService.getFileInfo(request.profilePicture);
      if (!fileInfo) {
        logger.warn(`Failed to get file info for user: ${userId}`);
        throw new AppError('Failed to validate profile picture file', ERROR_CODES.INVALID_REQUEST, 400);
      }

      // Validate file size (max 5MB)
      const MAX_FILE_SIZE = 5242880; // 5MB
      if (fileInfo.bytes > MAX_FILE_SIZE) {
        logger.warn(`Profile picture file too large for user: ${userId}, size: ${fileInfo.bytes} bytes`);
        throw new AppError('Profile picture file is too large. Maximum size is 5MB', ERROR_CODES.INVALID_REQUEST, 400);
      }

      // Validate file format
      const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
      if (!ALLOWED_FORMATS.includes(fileInfo.format.toLowerCase())) {
        logger.warn(`Invalid file format for user: ${userId}, format: ${fileInfo.format}`);
        throw new AppError('Invalid file format. Allowed formats: JPG, PNG, WEBP', ERROR_CODES.INVALID_REQUEST, 400);
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
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Track new profile picture URL for cleanup if database save fails
    const newProfilePictureUrl = updates.profilePicture;

    try {
      // Update user profile
      const updatedUser = await this.userRepository.updateUserProfile(userId, updates);

      // Emit socket event for admin dashboard
      try {
        const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
        socketEventService.emitUserUpdated(updatedUser);
      } catch (error) {
        // Don't fail profile update if socket emission fails
        logger.error('Error emitting user updated event:', error);
      }

      const updatedFields = Object.keys(updates);
      logger.info(`User profile updated successfully: ${updatedUser.email}, fields updated: ${updatedFields.join(', ')}`);

      const response = UserMapper.toUpdateUserProfileResponse(updatedUser);
      response.message = SUCCESS_MESSAGES.PROFILE_UPDATED;
      
      return response;
    } catch (error) {
      // If database save failed and we have a new profile picture, cleanup Cloudinary file
      if (newProfilePictureUrl) {
        await this.cleanupCloudinaryFile(newProfilePictureUrl, userId, error);
      }
      
      // Re-throw the original error
      throw error;
    }
  }

  /**
   * Cleans up Cloudinary file if database save fails
   * Prevents orphaned files in Cloudinary storage
   * Logs cleanup attempts and failures without throwing errors
   */
  private async cleanupCloudinaryFile(
    fileUrl: string,
    userId: string,
    originalError: unknown
  ): Promise<void> {
    try {
      logger.warn(
        `Database save failed for user ${userId}. Attempting to cleanup Cloudinary file: ${fileUrl}. Original error: ${originalError instanceof Error ? originalError.message : String(originalError)}`
      );

      await this.cloudinaryService.deleteFile(fileUrl);
      
      logger.info(`Successfully cleaned up Cloudinary file after database save failure for user: ${userId}`);
    } catch (cleanupError) {
      // Log cleanup failure but don't throw - original error is more important
      logger.error(
        `Failed to cleanup Cloudinary file after database save failure for user ${userId}. File URL: ${fileUrl}. Cleanup error: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}. Orphaned file may remain in Cloudinary.`
      );
      
      // Don't throw - we want to return the original database error, not cleanup error
    }
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

