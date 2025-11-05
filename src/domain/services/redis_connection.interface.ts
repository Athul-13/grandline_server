/**
 *  * Redis connection interface
 */
export interface IRedisConnection {
  /**
   * Gets a value from Redis by key
   */
  get(key: string): Promise<string | null>;

  /**
   * Sets a value in Redis with a key
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Sets a value in Redis with expiration time
   */
  setex(key: string, seconds: number, value: string): Promise<void>;

  /**
   * Deletes a key from Redis
   */
  del(key: string): Promise<void>;

  /**
   * Checks if Redis is connected
   */
  getConnectionStatus(): boolean;

  /**
   * Pings Redis to check connectivity
   */
  ping(): Promise<boolean>;
}

