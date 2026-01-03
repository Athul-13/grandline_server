import { container } from 'tsyringe';
import { SERVICE_TOKENS } from '../../application/di/tokens';
import { IOTPService } from '../../domain/services/otp_service.interface';
import { OTPServiceImpl } from '../service/otp.service';
import { ITokenBlacklistService } from '../../domain/services/token_blacklist_service.interface';
import { TokenBlacklistServiceImpl } from '../service/token_blacklist.service';
import { IJWTService } from '../../domain/services/jwt_service.interface';
import { JWTServiceImpl } from '../service/jwt.service';
import { IEmailService } from '../../domain/services/email_service.interface';
import { EmailServiceImpl } from '../service/email.service';
import { ICloudinaryService } from '../../domain/services/cloudinary_service.interface';
import { CloudinaryServiceImpl } from '../service/cloudinary.service';
import { IGoogleAuthService } from '../../domain/services/google_auth_service.interface';
import { GoogleAuthServiceImpl } from '../service/google_auth.service';
import { IRouteCalculationService } from '../../domain/services/route_calculation_service.interface';
import { RouteCalculationServiceImpl } from '../service/route_calculation.service';
import { IPricingCalculationService } from '../../domain/services/pricing_calculation_service.interface';
import { PricingCalculationServiceImpl } from '../service/pricing_calculation.service';
import { IVehicleRecommendationService } from '../../domain/services/vehicle_recommendation_service.interface';
import { VehicleRecommendationServiceImpl } from '../service/vehicle_recommendation.service';
import { IPDFGenerationService } from '../../domain/services/pdf_generation_service.interface';
import { PDFGenerationServiceImpl } from '../service/pdf_generation.service';
import { MapboxService } from '../service/mapbox.service';
import { ISocketEventService } from '../../domain/services/socket_event_service.interface';
import { SocketEventService } from '../service/socket_event.service';
import { IAutoDriverAssignmentService } from '../../domain/services/auto_driver_assignment_service.interface';
import { AutoDriverAssignmentServiceImpl } from '../service/auto_driver_assignment.service';
import { IQueueService } from '../../domain/services/queue_service.interface';
import { QueueServiceImpl } from '../service/queue.service';
import { IExpoPushNotificationService } from '../../domain/services/expo_push_notification_service.interface';
import { ExpoPushNotificationService } from '../service/expo_push_notification.service';
import { INotificationService } from '../../domain/services/notification_service.interface';
import { NotificationService } from '../service/notification.service';

/**
 * Registers all service dependencies in the DI container
 * Services are infrastructure implementations of domain interfaces
 */
export function registerServices(): void {
  // Authentication services
  container.register<IOTPService>(
    SERVICE_TOKENS.IOTPService,
    { useClass: OTPServiceImpl }
  );

  container.register<ITokenBlacklistService>(
    SERVICE_TOKENS.ITokenBlacklistService,
    { useClass: TokenBlacklistServiceImpl }
  );

  container.register<IJWTService>(
    SERVICE_TOKENS.IJWTService,
    { useClass: JWTServiceImpl }
  );

  // Communication services
  container.register<IEmailService>(
    SERVICE_TOKENS.IEmailService,
    { useClass: EmailServiceImpl }
  );

  // External services
  container.register<ICloudinaryService>(
    SERVICE_TOKENS.ICloudinaryService,
    { useClass: CloudinaryServiceImpl }
  );

  container.register<IGoogleAuthService>(
    SERVICE_TOKENS.IGoogleAuthService,
    { useClass: GoogleAuthServiceImpl }
  );

  // Business logic services
  // Register MapboxService (used by RouteCalculationService)
  container.register(MapboxService, { useClass: MapboxService });

  container.register<IRouteCalculationService>(
    SERVICE_TOKENS.IRouteCalculationService,
    { useClass: RouteCalculationServiceImpl }
  );

  container.register<IPricingCalculationService>(
    SERVICE_TOKENS.IPricingCalculationService,
    { useClass: PricingCalculationServiceImpl }
  );

  container.register<IVehicleRecommendationService>(
    SERVICE_TOKENS.IVehicleRecommendationService,
    { useClass: VehicleRecommendationServiceImpl }
  );

  container.register<IPDFGenerationService>(
    SERVICE_TOKENS.IPDFGenerationService,
    { useClass: PDFGenerationServiceImpl }
  );

  // Socket event service - register as singleton so all resolutions return the same instance
  // This ensures setIOServer(io) called in index.ts affects the same instance used everywhere
  container.registerSingleton<ISocketEventService>(
    SERVICE_TOKENS.ISocketEventService,
    SocketEventService
  );

  // Queue and auto-assignment services
  container.register<IAutoDriverAssignmentService>(
    SERVICE_TOKENS.IAutoDriverAssignmentService,
    { useClass: AutoDriverAssignmentServiceImpl }
  );

  container.register<IQueueService>(
    SERVICE_TOKENS.IQueueService,
    { useClass: QueueServiceImpl }
  );

  // Push notification service
  container.register<IExpoPushNotificationService>(
    SERVICE_TOKENS.IExpoPushNotificationService,
    { useClass: ExpoPushNotificationService }
  );

  // Notification service
  container.register<INotificationService>(
    SERVICE_TOKENS.INotificationService,
    { useClass: NotificationService }
  );
}
