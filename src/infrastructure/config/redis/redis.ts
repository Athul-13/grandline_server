import Redis from "ioredis";
import { REDIS_CONFIG } from "../../../shared/constants";

/**
 * Redis configuration factory
 * Creates Redis instances with proper configuration
 * Used by RedisConnection class for connection management
 */
export const createRedisConfig = () => {
  return {
    retryDelayOnClusterDown: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  };
};

/**
 * Creates a Redis instance with configuration
 * This is used by RedisConnection for the actual connection
 */
export const createRedisInstance = (): Redis => {
  return new Redis(REDIS_CONFIG.URI, createRedisConfig());
};