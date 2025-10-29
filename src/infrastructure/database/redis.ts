import Redis from 'ioredis';
import { createRedisInstance } from '../config/redis/redis';

/**
 * Redis connection class
 * Handles Redis connection, disconnection, and status monitoring
 * Similar to MongoDBConnection for consistent connection management
 */
export class RedisConnection {
  private static instance: RedisConnection;
  private redis: Redis;
  private isConnected: boolean = false;

  private constructor() {
    this.redis = createRedisInstance();

    // Set up event listeners
    this.setupEventListeners();
  }

  public static getInstance(): RedisConnection {
    if (!RedisConnection.instance) {
      RedisConnection.instance = new RedisConnection();
    }
    return RedisConnection.instance;
  }

  /**
   * Sets up Redis event listeners for connection monitoring
   */
  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      console.log('Redis connecting...');
    });

    this.redis.on('ready', () => {
      this.isConnected = true;
      console.log('Redis connected successfully');
    });

    this.redis.on('error', (error) => {
      this.isConnected = false;
      console.error('Redis connection error:', error);
    });

    this.redis.on('close', () => {
      this.isConnected = false;
      console.log('Redis connection closed');
    });

    this.redis.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });
  }


  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        console.log('Redis already connected');
        return;
      }

      // Check if already ready (handles fast connections)
      if (this.redis.status === 'ready') {
        this.isConnected = true;
        return;
      }

      // Connect to Redis
      await this.redis.connect();
      
      // Wait for the 'ready' event with timeout
      await new Promise<void>((resolve, reject) => {
        // Check status again in case it's already ready
        if (this.redis.status === 'ready') {
          resolve();
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Redis connection timeout'));
        }, 5000);

        const readyHandler = () => {
          clearTimeout(timeout);
          this.redis.removeListener('error', errorHandler);
          resolve();
        };

        const errorHandler = (error: Error) => {
          clearTimeout(timeout);
          this.redis.removeListener('ready', readyHandler);
          reject(error);
        };

        this.redis.once('ready', readyHandler);
        this.redis.once('error', errorHandler);
      });

    } catch (error) {
      console.error('Redis connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }


  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        console.log('Redis not connected');
        return;
      }

      await this.redis.disconnect();
      this.isConnected = false;
      console.log('Redis disconnected');
    } catch (error) {
      console.error('Redis disconnection error:', error);
      throw error;
    }
  }


  public getClient(): Redis {
    return this.redis;
  }


  public getConnectionStatus(): boolean {
    return this.isConnected;
  }


  public async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch (error) {
      console.error('Redis ping failed:', error);
      return false;
    }
  }
}