import { injectable, inject } from 'tsyringe';
import { MongoDBConnection } from '../../database/mongodb';
import { RedisConnection } from '../../database/redis';
import { CONFIG_TOKENS } from '../../di/tokens';

/**
 * Connection status interface
 * Provides information about database connection states
 */
export interface ConnectionStatus {
  mongodb: boolean;
  redis: boolean;
  allConnected: boolean;
}

/**
 * Database connector class
 * Orchestrates database connections 
 */
@injectable()
export class DatabaseConnector {
  constructor(
    @inject(CONFIG_TOKENS.MongoDBConnection)
    private readonly mongoConnection: MongoDBConnection,
    @inject(CONFIG_TOKENS.RedisConnection)
    private readonly redisConnection: RedisConnection
  ) {}

  /**
   * Connects to all databases (MongoDB and Redis)
   * Handles connections sequentially to ensure proper initialization order
   */
  public async connectAll(): Promise<void> {
    try {
      // Connect to MongoDB first
      await this.mongoConnection.connect();

      // Then connect to Redis
      await this.redisConnection.connect();

      console.log('All databases connected successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  /**
   * Disconnects from all databases
   */
  public async disconnectAll(): Promise<void> {
    try {
      await Promise.all([this.mongoConnection.disconnect(), this.redisConnection.disconnect()]);
      console.log('All databases disconnected');
    } catch (error) {
      console.error('Database disconnection error:', error);
      throw error;
    }
  }

  /**
   * Gets connection status for all databases
   */
  public getConnectionStatus(): ConnectionStatus {
    const mongodb = this.mongoConnection.getConnectionStatus();
    const redis = this.redisConnection.getConnectionStatus();

    return {
      mongodb,
      redis,
      allConnected: mongodb && redis,
    };
  }
}

