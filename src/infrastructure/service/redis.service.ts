import { injectable } from 'tsyringe';
import { IRedisService } from '../../domain/services/redis_service.interface';
import { OTP_CONFIG } from '../../shared/constants';
import { RedisConnection } from '../database/redis';

/**
 * Redis service implementation for OTP operations
 * Provides temporary storage and retrieval of verification codes
 */
@injectable()
export class RedisServiceImpl implements IRedisService {
  private redisConnection: RedisConnection;

  constructor() {
    this.redisConnection = RedisConnection.getInstance();
  }

  async setOTP(email: string, otp: string): Promise<void> {
    const key = `${OTP_CONFIG.REDIS_PREFIX}${email}`;
    const redis = this.redisConnection.getClient();
    // Store with expiry time (convert milliseconds to seconds)
    await redis.setex(key, OTP_CONFIG.EXPIRY_TIME / 1000, otp);
  }

  async getOTP(email: string): Promise<string | null> {
    const key = `${OTP_CONFIG.REDIS_PREFIX}${email}`;
    const redis = this.redisConnection.getClient();
    return await redis.get(key);
  }

  async deleteOTP(email: string): Promise<void> {
    const key = `${OTP_CONFIG.REDIS_PREFIX}${email}`;
    const redis = this.redisConnection.getClient();
    await redis.del(key);
  }

  isConnected(): boolean {
    return this.redisConnection.getConnectionStatus();
  }
}