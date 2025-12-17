import { DriverFcmToken } from '../entities/driver_fcm_token.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for DriverFcmToken entity operations
 * Defines the contract for data access layer implementations
 */
export interface IDriverFcmTokenRepository extends IBaseRepository<DriverFcmToken> {
  /**
   * Find token by driver ID and platform
   */
  findByDriverIdAndPlatform(driverId: string, platform: 'ios' | 'android'): Promise<DriverFcmToken | null>;

  /**
   * Find all tokens for a driver
   */
  findByDriverId(driverId: string): Promise<DriverFcmToken[]>;

  /**
   * Find token by FCM token string
   */
  findByFcmToken(fcmToken: string): Promise<DriverFcmToken | null>;

  /**
   * Delete all tokens for a driver
   */
  deleteByDriverId(driverId: string): Promise<void>;

  /**
   * Delete token by FCM token string
   */
  deleteByFcmToken(fcmToken: string): Promise<void>;
}

