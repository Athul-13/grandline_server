import { injectable, inject } from 'tsyringe';
import { ITokenBlacklistService } from '../../domain/services/token_blacklist_service.interface';
import { RedisConnection } from '../database/redis';
import { TOKEN_BLACKLIST } from '../../shared/constants';
import { CONFIG_TOKENS } from '../di/tokens';

/**
 * Token blacklist service implementation
 * Handles blacklisting of JWT tokens using Redis
 */
@injectable()
export class TokenBlacklistServiceImpl implements ITokenBlacklistService {
  private readonly BLACKLIST_PREFIX = TOKEN_BLACKLIST.PREFIX;

  constructor(
    @inject(CONFIG_TOKENS.RedisConnection)
    private readonly redisConnection: RedisConnection
  ) {}

  async blacklistToken(token: string, expiryTime: number): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const redis = this.redisConnection.getClient();
    // Store 'true' as value, expire after expiryTime seconds
    await redis.setex(key, expiryTime, 'true');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const redis = this.redisConnection.getClient();
    const result = await redis.get(key);
    return result !== null;
  }

  async removeFromBlacklist(token: string): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const redis = this.redisConnection.getClient();
    await redis.del(key);
  }
}
