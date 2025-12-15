/**
 * Save Driver FCM Token Use Case Interface
 * Defines the contract for saving driver FCM tokens
 */

export interface SaveDriverFcmTokenRequest {
  driverId: string;
  fcmToken: string;
  deviceId?: string;
  platform: 'ios' | 'android';
}

export interface SaveDriverFcmTokenResponse {
  success: boolean;
  message: string;
  tokenId?: string;
}

export interface ISaveDriverFcmTokenUseCase {
  execute(request: SaveDriverFcmTokenRequest): Promise<SaveDriverFcmTokenResponse>;
}

