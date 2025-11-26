import { container } from 'tsyringe';
import { CONTROLLER_TOKENS } from './tokens';
import { AuthController } from '../../presentation/controllers/auth/auth.controller';
import { OtpController } from '../../presentation/controllers/auth/otp.controller';
import { TokenController } from '../../presentation/controllers/auth/token.controller';
import { UserController } from '../../presentation/controllers/user/user.controller';
import { VehicleTypeController } from '../../presentation/controllers/vehicle_type/vehicle_type.controller';
import { VehicleController } from '../../presentation/controllers/vehicle/vehicle.controller';
import { AmenityController } from '../../presentation/controllers/amenity/amenity.controller';
import { QuoteController } from '../../presentation/controllers/quote/quote.controller';
import { EventTypeController } from '../../presentation/controllers/event_type/event_type.controller';
import { AdminQuoteController } from '../../presentation/controllers/admin/admin_quote.controller';
import { AdminPricingConfigController } from '../../presentation/controllers/admin/admin_pricing_config.controller';
import { ChatController } from '../../presentation/controllers/chat/chat.controller';
import { MessageController } from '../../presentation/controllers/message/message.controller';
import { NotificationController } from '../../presentation/controllers/notification/notification.controller';

/**
 * Registers all controller dependencies in the DI container
 * Controllers handle HTTP requests and delegate to use cases
 */
export function registerControllers(): void {
  // Auth controllers
  container.register(CONTROLLER_TOKENS.AuthController, AuthController);
  container.register(CONTROLLER_TOKENS.OtpController, OtpController);
  container.register(CONTROLLER_TOKENS.TokenController, TokenController);
  // User controller
  container.register(CONTROLLER_TOKENS.UserController, UserController);
  // Vehicle controllers
  container.register(CONTROLLER_TOKENS.VehicleTypeController, VehicleTypeController);
  container.register(CONTROLLER_TOKENS.VehicleController, VehicleController);
  // Quote controllers
  container.register(CONTROLLER_TOKENS.QuoteController, QuoteController);
  container.register(CONTROLLER_TOKENS.AdminQuoteController, AdminQuoteController);
  // Other controllers
  container.register(CONTROLLER_TOKENS.AmenityController, AmenityController);
  container.register(CONTROLLER_TOKENS.EventTypeController, EventTypeController);
  container.register(CONTROLLER_TOKENS.AdminPricingConfigController, AdminPricingConfigController);
  // Chat, Message & Notification controllers
  container.register(CONTROLLER_TOKENS.ChatController, ChatController);
  container.register(CONTROLLER_TOKENS.MessageController, MessageController);
  container.register(CONTROLLER_TOKENS.NotificationController, NotificationController);
}

