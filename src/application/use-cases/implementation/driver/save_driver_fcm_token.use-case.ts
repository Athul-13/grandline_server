import { injectable, inject } from 'tsyringe';
import { IDriverFcmTokenRepository } from '../../../../domain/repositories/driver_fcm_token_repository.interface';
import { DriverFcmToken } from '../../../../domain/entities/driver_fcm_token.entity';
import {
  ISaveDriverFcmTokenUseCase,
  SaveDriverFcmTokenRequest,
  SaveDriverFcmTokenResponse,
} from '../../interface/driver/save_driver_fcm_token_use_case.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for saving driver FCM token
 * Creates or updates FCM token for push notifications
 */
@injectable()
export class SaveDriverFcmTokenUseCase implements ISaveDriverFcmTokenUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverFcmTokenRepository)
    private readonly fcmTokenRepository: IDriverFcmTokenRepository
  ) {}

  async execute(request: SaveDriverFcmTokenRequest): Promise<SaveDriverFcmTokenResponse> {
    // Input validation
    if (!request.driverId || !request.fcmToken || !request.platform) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    try {
      // Check if token already exists for this driver and platform
      const existingToken = await this.fcmTokenRepository.findByDriverIdAndPlatform(
        request.driverId,
        request.platform
      );

      if (existingToken) {
        // Update existing token
        const updatedToken = existingToken.updateToken(request.fcmToken, request.deviceId || null);
        await this.fcmTokenRepository.updateById(existingToken.tokenId, updatedToken);
        logger.info(`[SaveDriverFcmToken] Updated FCM token for driver: ${request.driverId}, platform: ${request.platform}`);
        return {
          success: true,
          message: 'FCM token updated successfully',
          tokenId: existingToken.tokenId,
        };
      }

      // Check if token exists for another driver (shouldn't happen, but handle it)
      const tokenByFcm = await this.fcmTokenRepository.findByFcmToken(request.fcmToken);
      if (tokenByFcm) {
        // Delete old token and create new one
        await this.fcmTokenRepository.deleteByFcmToken(request.fcmToken);
        logger.warn(`[SaveDriverFcmToken] Deleted existing FCM token for different driver: ${tokenByFcm.driverId}`);
      }

      // Create new token
      const newToken = new DriverFcmToken(
        uuidv4(),
        request.driverId,
        request.fcmToken,
        request.deviceId || null,
        request.platform,
        new Date(),
        new Date()
      );

      await this.fcmTokenRepository.create(newToken);
      logger.info(`[SaveDriverFcmToken] Created new FCM token for driver: ${request.driverId}, platform: ${request.platform}`);
      
      return {
        success: true,
        message: 'FCM token saved successfully',
        tokenId: newToken.tokenId,
      };
    } catch (error) {
      logger.error(`[SaveDriverFcmToken] Error saving FCM token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new AppError(
        'Failed to save FCM token',
        ERROR_CODES.SERVER_ERROR,
        500
      );
    }
  }
}

