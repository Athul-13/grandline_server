/**
 * Driver FCM Token Domain Entity
 * Represents a driver's FCM token for push notifications
 */

export class DriverFcmToken {
  constructor(
    public readonly tokenId: string,
    public readonly driverId: string,
    public readonly fcmToken: string,
    public readonly deviceId: string | null,
    public readonly platform: 'ios' | 'android',
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Check if token is valid (not expired)
   * Tokens are considered valid if updated within last 30 days
   */
  isValid(): boolean {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.updatedAt >= thirtyDaysAgo;
  }

  /**
   * Update token information
   */
  updateToken(fcmToken: string, deviceId: string | null): DriverFcmToken {
    return new DriverFcmToken(
      this.tokenId,
      this.driverId,
      fcmToken,
      deviceId,
      this.platform,
      this.createdAt,
      new Date()
    );
  }
}

