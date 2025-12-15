/**
 * Expo Push Notification Types
 * Type definitions for Expo Push Notification service
 */

/**
 * Expo push notification message structure
 */
export interface ExpoPushMessage {
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
export interface ExpoPushResponse {
  data: Array<{
    status: 'ok' | 'error';
    id?: string;
    message?: string;
    details?: {
      error?: string;
    };
  }>;
}

