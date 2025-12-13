/**
 * Expo Push Notification Service
 * Handles sending push notifications via Expo Push Notification service
 */

import { injectable, inject } from 'tsyringe';
import { IDriverFcmTokenRepository } from '../../domain/repositories/driver_fcm_token_repository.interface';
import { REPOSITORY_TOKENS } from '../../application/di/tokens';
import { logger } from '../../shared/logger';

/**
 * Expo Push Notification API endpoint
 */
const EXPO_PUSH_API_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Expo push notification message structure
 */
interface ExpoPushMessage {
  to: string; // Expo push token
  sound?: 'default';
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

/**
 * Expo push notification response
 */
interface ExpoPushResponse {
  data: Array<{
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: {
      error?: string;
    };
  }>;
}

/**
 * Expo Push Notification Service
 * Sends push notifications to mobile devices via Expo Push Notification service
 */
@injectable()
export class ExpoPushNotificationService {
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
      const errors = responseData.data.filter((result: { status: string; details?: { error?: string } }) => result.status === 'error');
      if (errors.length > 0) {
        logger.error(`[ExpoPushNotification] Errors sending push notifications: ${JSON.stringify(errors)}`);
        
        // Remove invalid tokens
        for (const errorItem of errors) {
          if (errorItem.details?.error === 'DeviceNotRegistered') {
            // Find and delete the invalid token
            const invalidToken = validTokens.find((token) => 
              messages.some((msg) => msg.to === token.fcmToken)
            );
            if (invalidToken) {
              await this.fcmTokenRepository.deleteByFcmToken(invalidToken.fcmToken);
              logger.info(`[ExpoPushNotification] Deleted invalid token: ${invalidToken.fcmToken}`);
            }
          }
        }
      }

      const successCount = responseData.data.filter((result: { status: string }) => result.status === 'ok').length;
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

