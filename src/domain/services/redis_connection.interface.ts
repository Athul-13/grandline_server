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

  // Set operations for presence management
  /**
   * Adds a member to a Redis Set
   */
  sadd(key: string, member: string): Promise<number>;

  /**
   * Removes a member from a Redis Set
   */
  srem(key: string, member: string): Promise<number>;

  /**
   * Gets all members of a Redis Set
   */
  smembers(key: string): Promise<string[]>;

  /**
   * Checks if a member exists in a Redis Set
   */
  sismember(key: string, member: string): Promise<number>;

  /**
   * Gets the number of members in a Redis Set
   */
  scard(key: string): Promise<number>;

  /**
   * Removes all members from a Redis Set
   */
  sremall(key: string): Promise<number>;
}

