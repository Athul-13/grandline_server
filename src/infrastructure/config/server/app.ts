import { Application } from 'express';
import { injectable, inject } from 'tsyringe';
import { CONFIG_TOKENS } from '../../di/tokens';
import { MiddlewareConfigurator } from './middleware.configurator';
import { DatabaseConnector } from './database.connector';
import { ConnectionStatus } from './database.connector';
import { createAuthRoutesWithDI } from '../../../presentation/routes/auth/auth.routes';

/**
 * Express application wrapper class
 * Coordinates application setup (middleware + database connections)
 * Uses Dependency Injection for all dependencies
 */
@injectable()
export class App {
  private middlewareConfigurator: MiddlewareConfigurator;
  private databaseConnector: DatabaseConnector;

  /**
   * Creates a new App instance
   * All dependencies are injected via DI
   */
  constructor(
    @inject(CONFIG_TOKENS.ExpressApp)
    private readonly app: Application,
    @inject(CONFIG_TOKENS.DatabaseConnector)
    databaseConnector: DatabaseConnector,
    @inject(CONFIG_TOKENS.MiddlewareConfigurator)
    middlewareConfigurator: MiddlewareConfigurator
  ) {
    this.databaseConnector = databaseConnector;
    this.middlewareConfigurator = middlewareConfigurator;

    // Configure all middleware (errorHandler passed during DI registration)
    this.middlewareConfigurator.configure();
  }

  /**
   * Connects to all databases (MongoDB and Redis)
   * Delegates to DatabaseConnector
   */
  public async connectDatabases(): Promise<void> {
    await this.databaseConnector.connectAll();
  }

  /**
   * Disconnects from all databases
   * Delegates to DatabaseConnector
   */
  public async disconnectDatabases(): Promise<void> {
    await this.databaseConnector.disconnectAll();
  }

  /**
   * Gets the connection status of all databases
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.databaseConnector.getConnectionStatus();
  }

  /**
   * Registers API routes
   * Controllers are resolved here (after DI registration)
   */
  public registerRoutes(): void {
    const authRoutes = createAuthRoutesWithDI();
    this.app.use(`/api/v1/auth`, authRoutes);
  }

  /**
   * Gets the configured Express application
   */
  public getApp(): Application {
    return this.app;
  }
}
