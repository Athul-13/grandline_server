import { injectable, inject } from 'tsyringe';
import { ITokenBlacklistService } from '../../domain/services/token_blacklist_service.interface';
import { IRedisConnection } from '../../domain/services/redis_connection.interface';
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
    private readonly redisConnection: IRedisConnection
  ) {}

  async blacklistToken(token: string, expiryTime: number): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    await this.redisConnection.setex(key, expiryTime, 'true');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    const result = await this.redisConnection.get(key);
    return result !== null;
  }

  async removeFromBlacklist(token: string): Promise<void> {
    const key = `${this.BLACKLIST_PREFIX}${token}`;
    await this.redisConnection.del(key);
  }
}
