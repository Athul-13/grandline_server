import mongoose from 'mongoose';
import { injectable } from 'tsyringe';
import { APP_CONFIG, DATABASE_CONFIG } from '../../shared/config';

/**
 * MongoDB connection class
 * Handles database connection and disconnection with retry logic
 * Uses Dependency Injection instead of singleton pattern
 */
@injectable()
export class MongoDBConnection {
  private isConnected: boolean = false;
  private connectionAttempts: number = 0;

  /**
   * Connects to MongoDB with retry logic
   * Retries connection on failure based on DATABASE_CONFIG.MONGODB settings
   */
  public async connect(): Promise<void> {
    try {
      if (this.isConnected) {
        console.log('MongoDB already connected');
        return;
      }

      // Reset attempts for new connection
      this.connectionAttempts = 0;

      // Attempt connection with retries
      await this.attemptConnectionWithRetry();

      this.isConnected = true;
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Attempts connection with retry logic
   */
  private async attemptConnectionWithRetry(): Promise<void> {
    const { RETRY_ATTEMPTS, RETRY_DELAY, CONNECTION_TIMEOUT } = DATABASE_CONFIG.MONGODB;

    for (let attempt = 1; attempt <= RETRY_ATTEMPTS; attempt++) {
      try {
        this.connectionAttempts = attempt;

        // Set connection timeout
        const connectionPromise = mongoose.connect(APP_CONFIG.MONGODB_URI, {
          serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
        });

        // Race between connection and timeout
        await Promise.race([
          connectionPromise,
          new Promise<void>((_, reject) =>
            setTimeout(
              () => reject(new Error(`MongoDB connection timeout after ${CONNECTION_TIMEOUT}ms`)),
              CONNECTION_TIMEOUT
            )
          ),
        ]);

        // Success - reset attempts
        this.connectionAttempts = 0;
        return;
      } catch (error) {
        if (attempt === RETRY_ATTEMPTS) {
          // Last attempt failed
          throw new Error(
            `MongoDB connection failed after ${RETRY_ATTEMPTS} attempts: ${error instanceof Error ? error.message : String(error)}`
          );
        }

        console.warn(
          `MongoDB connection attempt ${attempt}/${RETRY_ATTEMPTS} failed. Retrying in ${RETRY_DELAY}ms...`
        );

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  public async disconnect(): Promise<void> {
    try {
      if (!this.isConnected) {
        console.log('MongoDB not connected');
        return;
      }

      await mongoose.disconnect();
      this.isConnected = false;
      console.log('MongoDB disconnected');
    } catch (error) {
      console.error('MongoDB disconnection error:', error);
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}
