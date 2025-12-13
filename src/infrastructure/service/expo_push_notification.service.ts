/**
 * Expo Push Notification Service
 * Handles sending push notifications via Expo Push Notification service
 */

import { injectable, inject } from 'tsyringe';
import { IDriverFcmTokenRepository } from '../../domain/repositories/driver_fcm_token_repository.interface';
import { IExpoPushNotificationService } from '../../domain/services/expo_push_notification_service.interface';
import { REPOSITORY_TOKENS } from '../../application/di/tokens';
import { EXPO_PUSH_API_URL } from '../../shared/constants';
import { logger } from '../../shared/logger';
import type { ExpoPushMessage, ExpoPushResponse } from '../../shared/types';

/**
 * Expo Push Notification Service
 * Sends push notifications to mobile devices via Expo Push Notification service
 */
@injectable()
export class ExpoPushNotificationService implements IExpoPushNotificationService {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverFcmTokenRepository)
    private readonly fcmTokenRepository: IDriverFcmTokenRepository
  ) {}

  /**
   * Send push notification to a driver
   */
  async sendToDriver(
    driverId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      sound?: 'default';
      badge?: number;
    }
  ): Promise<boolean> {
    try {
      // Get all FCM tokens for the driver
      const tokens = await this.fcmTokenRepository.findByDriverId(driverId);
      
      if (tokens.length === 0) {
        logger.warn(`[ExpoPushNotification] No FCM tokens found for driver: ${driverId}`);
        return false;
      }

      // Filter valid tokens
      const validTokens = tokens.filter((token) => token.isValid());
      
      if (validTokens.length === 0) {
        logger.warn(`[ExpoPushNotification] No valid FCM tokens found for driver: ${driverId}`);
        return false;
      }

      // Prepare messages for all valid tokens
      const messages: ExpoPushMessage[] = validTokens.map((token) => ({
        to: token.fcmToken,
        sound: notification.sound || 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        badge: notification.badge,
        priority: 'high',
      }));

      // Send notifications using Node's built-in fetch
      const response = await fetch(EXPO_PUSH_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error(`Expo Push API returned status ${response.status}: ${response.statusText}`);
      }

      const responseData = (await response.json()) as ExpoPushResponse;

      // Check for errors
      const errors = responseData.data.filter((result): result is ExpoPushResponse['data'][number] & { status: 'error' } => result.status === 'error');
      if (errors.length > 0) {
        logger.error(`[ExpoPushNotification] Errors sending push notifications: ${JSON.stringify(errors)}`);
        
        // Remove invalid tokens
        for (let i = 0; i < errors.length; i++) {
          const errorItem = errors[i];
          if (errorItem.details?.error === 'DeviceNotRegistered') {
            // Find the corresponding message index
            const errorIndex = responseData.data.findIndex((result) => result === errorItem);
            if (errorIndex >= 0 && errorIndex < messages.length) {
              const errorMessage = messages[errorIndex];
              const invalidToken = validTokens.find((token) => token.fcmToken === errorMessage.to);
              if (invalidToken) {
                await this.fcmTokenRepository.deleteByFcmToken(invalidToken.fcmToken);
                logger.info(`[ExpoPushNotification] Deleted invalid token: ${invalidToken.fcmToken}`);
              }
            }
          }
        }
      }

      const successCount = responseData.data.filter((result): result is ExpoPushResponse['data'][number] & { status: 'ok' } => result.status === 'ok').length;
      logger.info(`[ExpoPushNotification] Sent ${successCount}/${validTokens.length} push notifications to driver: ${driverId}`);
      
      return successCount > 0;
    } catch (error) {
      logger.error(`[ExpoPushNotification] Error sending push notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Send push notification to multiple drivers
   */
  async sendToDrivers(
    driverIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      sound?: 'default';
      badge?: number;
    }
  ): Promise<number> {
    let successCount = 0;
    for (const driverId of driverIds) {
      const success = await this.sendToDriver(driverId, notification);
      if (success) {
        successCount++;
      }
    }
    return successCount;
  }
}

