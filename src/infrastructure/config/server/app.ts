import { Application } from 'express';
import { injectable, inject } from 'tsyringe';
import { CONFIG_TOKENS } from '../../di/tokens';
import { MiddlewareConfigurator } from './middleware.configurator';
import { DatabaseConnector } from './database.connector';
import { ConnectionStatus } from './database.connector';
import { createAuthRoutesWithDI } from '../../../presentation/routes/auth/auth_routes';
import { createUserRoutesWithDI } from '../../../presentation/routes/user/user_routes';
import { createVehicleTypeRoutesWithDI } from '../../../presentation/routes/vehicle_type/vehicle_type_routes';
import { createVehicleRoutesWithDI } from '../../../presentation/routes/vehicle/vehicle_routes';
import { createAmenityRoutesWithDI } from '../../../presentation/routes/amenity/amenity_routes';
import { createQuoteRoutesWithDI } from '../../../presentation/routes/quote/quote_routes';
import { createEventTypeRoutesWithDI } from '../../../presentation/routes/event_type/event_type_routes';
import { createAdminQuoteRoutesWithDI } from '../../../presentation/routes/admin/admin_quote_routes';
import { createAdminPricingConfigRoutesWithDI } from '../../../presentation/routes/admin/admin_pricing_config_routes';
import { createChatRoutesWithDI } from '../../../presentation/routes/chat/chat_routes';
import { createMessageRoutesWithDI } from '../../../presentation/routes/message/message_routes';
import { createNotificationRoutesWithDI } from '../../../presentation/routes/notification/notification_routes';

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

    const userRoutes = createUserRoutesWithDI();
    this.app.use(`/api/v1/user`, userRoutes);

    const vehicleTypeRoutes = createVehicleTypeRoutesWithDI();
    this.app.use(`/api/v1/vehicle-types`, vehicleTypeRoutes);

    const vehicleRoutes = createVehicleRoutesWithDI();
    this.app.use(`/api/v1/vehicles`, vehicleRoutes);

    const amenityRoutes = createAmenityRoutesWithDI();
    this.app.use(`/api/v1/amenities`, amenityRoutes);

    const quoteRoutes = createQuoteRoutesWithDI();
    this.app.use(`/api/v1/quotes`, quoteRoutes);

    const eventTypeRoutes = createEventTypeRoutesWithDI();
    this.app.use(`/api/v1/event-types`, eventTypeRoutes);

    const adminQuoteRoutes = createAdminQuoteRoutesWithDI();
    this.app.use(`/api/v1/admin/quotes`, adminQuoteRoutes);

    const adminPricingConfigRoutes = createAdminPricingConfigRoutesWithDI();
    this.app.use(`/api/v1/admin/pricing-config`, adminPricingConfigRoutes);

    const chatRoutes = createChatRoutesWithDI();
    this.app.use(`/api/v1/chats`, chatRoutes);

    const messageRoutes = createMessageRoutesWithDI();
    this.app.use(`/api/v1/messages`, messageRoutes);

    const notificationRoutes = createNotificationRoutesWithDI();
    this.app.use(`/api/v1/notifications`, notificationRoutes);
  }

  /**
   * Gets the configured Express application
   */
  public getApp(): Application {
    return this.app;
  }
}
