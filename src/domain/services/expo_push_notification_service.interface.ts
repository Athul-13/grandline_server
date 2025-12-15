/**
 * Expo Push Notification Service Interface
 * Defines contract for sending push notifications via Expo Push Notification service
 */

export interface IExpoPushNotificationService {
  /**
   * Send push notification to a driver
   * @param driverId - Driver ID to send notification to
   * @param notification - Notification data
   * @returns Promise<boolean> - True if at least one notification was sent successfully
   */
  sendToDriver(
    driverId: string,
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      sound?: 'default';
      badge?: number;
    }
  ): Promise<boolean>;

  /**
   * Send push notification to multiple drivers
   * @param driverIds - Array of driver IDs
   * @param notification - Notification data
   * @returns Promise<number> - Number of drivers who received the notification successfully
   */
  sendToDrivers(
    driverIds: string[],
    notification: {
      title: string;
      body: string;
      data?: Record<string, unknown>;
      sound?: 'default';
      badge?: number;
    }
  ): Promise<number>;
}

