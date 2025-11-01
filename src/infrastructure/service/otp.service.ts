import { injectable, inject } from 'tsyringe';
import { IOTPService } from '../../domain/services/otp_service.interface';
import { OTP_CONFIG } from '../../shared/constants';
import { RedisConnection } from '../database/redis';
import { CONFIG_TOKENS } from '../di/tokens';

/**
 * OTP service implementation
 * Provides temporary storage and retrieval of verification codes using Redis
 */
@injectable()
export class OTPServiceImpl implements IOTPService {
  constructor(
    @inject(CONFIG_TOKENS.RedisConnection)
    private readonly redisConnection: RedisConnection
  ) {}

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
