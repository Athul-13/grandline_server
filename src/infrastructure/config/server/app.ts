import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from '../../../presentation/middleware/errorHandler';
import { MongoDBConnection } from '../../database/mongodb';
import { RedisConnection } from '../../database/redis';

/**
 * Express application wrapper class
 * Handles Express app configuration and middleware setup
 */
export class App {
  private app: Application;
  private mongoConnection: MongoDBConnection;

  constructor() {
    this.app = express();
    this.mongoConnection = MongoDBConnection.getInstance();
    this.setupMiddleware();
  }

  /**
   * Sets up all middleware for the Express application
   */
  private setupMiddleware(): void {
    // CORS middleware
    this.app.use(cors());
    
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Error handling middleware (must be last)
    this.app.use(errorHandler);
  }

  /**
   * Connects to MongoDB database
   * @returns Promise<void>
   */
  public async connectDatabase(): Promise<void> {
    await this.mongoConnection.connect();
  }

  /**
   * Connects to Redis database
   * @returns Promise<void>
   */
    public async connectRedis(): Promise<void> {
      await RedisConnection.getInstance().connect(); 
    }

  /**
   * Gets the configured Express application
   * @returns Express Application instance
   */
  public getApp(): Application {
    return this.app;
  }
}
