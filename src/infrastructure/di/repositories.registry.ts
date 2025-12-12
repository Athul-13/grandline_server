import { container } from 'tsyringe';
import { REPOSITORY_TOKENS } from '../../application/di/tokens';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { UserRepositoryImpl } from '../repositories/user.repository';
import { IDriverRepository } from '../../domain/repositories/driver_repository.interface';
import { DriverRepositoryImpl } from '../repositories/driver.repository';
import { IVehicleTypeRepository } from '../../domain/repositories/vehicle_type_repository.interface';
import { VehicleTypeRepositoryImpl } from '../repositories/vehicle_type.repository';
import { IVehicleRepository } from '../../domain/repositories/vehicle_repository.interface';
import { VehicleRepositoryImpl } from '../repositories/vehicle.repository';
import { IAmenityRepository } from '../../domain/repositories/amenity_repository.interface';
import { AmenityRepositoryImpl } from '../repositories/amenity.repository';
import { IQuoteRepository } from '../../domain/repositories/quote_repository.interface';
import { QuoteRepositoryImpl } from '../repositories/quote.repository';
import { IQuoteItineraryRepository } from '../../domain/repositories/quote_itinerary_repository.interface';
import { QuoteItineraryRepositoryImpl } from '../repositories/quote_itinerary.repository';
import { IPassengerRepository } from '../../domain/repositories/passenger_repository.interface';
import { PassengerRepositoryImpl } from '../repositories/passenger.repository';
import { IPricingConfigRepository } from '../../domain/repositories/pricing_config_repository.interface';
import { PricingConfigRepositoryImpl } from '../repositories/pricing_config.repository';
import { IEventTypeRepository } from '../../domain/repositories/event_type_repository.interface';
import { EventTypeRepositoryImpl } from '../repositories/event_type.repository';
import { IChatRepository } from '../../domain/repositories/chat_repository.interface';
import { ChatRepositoryImpl } from '../repositories/chat.repository';
import { IMessageRepository } from '../../domain/repositories/message_repository.interface';
import { MessageRepositoryImpl } from '../repositories/message.repository';
import { INotificationRepository } from '../../domain/repositories/notification_repository.interface';
import { NotificationRepositoryImpl } from '../repositories/notification.repository';
import { IPaymentRepository } from '../../domain/repositories/payment_repository.interface';
import { PaymentRepositoryImpl } from '../repositories/payment.repository';
import { IReservationRepository } from '../../domain/repositories/reservation_repository.interface';
import { ReservationRepositoryImpl } from '../repositories/reservation.repository';
import { IReservationItineraryRepository } from '../../domain/repositories/reservation_itinerary_repository.interface';
import { ReservationItineraryRepositoryImpl } from '../repositories/reservation_itinerary.repository';
import { IReservationModificationRepository } from '../../domain/repositories/reservation_modification_repository.interface';
import { ReservationModificationRepositoryImpl } from '../repositories/reservation_modification.repository';
import { IReservationChargeRepository } from '../../domain/repositories/reservation_charge_repository.interface';
import { ReservationChargeRepositoryImpl } from '../repositories/reservation_charge.repository';

/**
 * Registers all repository dependencies in the DI container
 * Repositories are infrastructure implementations of domain repository interfaces
 */
export function registerRepositories(): void {
  // User & Driver repositories
  container.register<IUserRepository>(
    REPOSITORY_TOKENS.IUserRepository,
    { useClass: UserRepositoryImpl }
  );

  container.register<IDriverRepository>(
    REPOSITORY_TOKENS.IDriverRepository,
    { useClass: DriverRepositoryImpl }
  );

  // Vehicle repositories
  container.register<IVehicleTypeRepository>(
    REPOSITORY_TOKENS.IVehicleTypeRepository,
    { useClass: VehicleTypeRepositoryImpl }
  );

  container.register<IVehicleRepository>(
    REPOSITORY_TOKENS.IVehicleRepository,
    { useClass: VehicleRepositoryImpl }
  );

  // Amenity repository
  container.register<IAmenityRepository>(
    REPOSITORY_TOKENS.IAmenityRepository,
    { useClass: AmenityRepositoryImpl }
  );

  // Quote repositories
  container.register<IQuoteRepository>(
    REPOSITORY_TOKENS.IQuoteRepository,
    { useClass: QuoteRepositoryImpl }
  );

  container.register<IQuoteItineraryRepository>(
    REPOSITORY_TOKENS.IQuoteItineraryRepository,
    { useClass: QuoteItineraryRepositoryImpl }
  );

  container.register<IPassengerRepository>(
    REPOSITORY_TOKENS.IPassengerRepository,
    { useClass: PassengerRepositoryImpl }
  );

  // Pricing & Event Type repositories
  container.register<IPricingConfigRepository>(
    REPOSITORY_TOKENS.IPricingConfigRepository,
    { useClass: PricingConfigRepositoryImpl }
  );

  container.register<IEventTypeRepository>(
    REPOSITORY_TOKENS.IEventTypeRepository,
    { useClass: EventTypeRepositoryImpl }
  );

  // Chat, Message & Notification repositories
  container.register<IChatRepository>(
    REPOSITORY_TOKENS.IChatRepository,
    { useClass: ChatRepositoryImpl }
  );

  container.register<IMessageRepository>(
    REPOSITORY_TOKENS.IMessageRepository,
    { useClass: MessageRepositoryImpl }
  );

  container.register<INotificationRepository>(
    REPOSITORY_TOKENS.INotificationRepository,
    { useClass: NotificationRepositoryImpl }
  );

  // Payment repository
  container.register<IPaymentRepository>(
    REPOSITORY_TOKENS.IPaymentRepository,
    { useClass: PaymentRepositoryImpl }
  );

  // Reservation repository
  container.register<IReservationRepository>(
    REPOSITORY_TOKENS.IReservationRepository,
    { useClass: ReservationRepositoryImpl }
  );

  // Reservation Itinerary repository
  container.register<IReservationItineraryRepository>(
    REPOSITORY_TOKENS.IReservationItineraryRepository,
    { useClass: ReservationItineraryRepositoryImpl }
  );

  // Reservation Modification repository
  container.register<IReservationModificationRepository>(
    REPOSITORY_TOKENS.IReservationModificationRepository,
    { useClass: ReservationModificationRepositoryImpl }
  );

  // Reservation Charge repository
  container.register<IReservationChargeRepository>(
    REPOSITORY_TOKENS.IReservationChargeRepository,
    { useClass: ReservationChargeRepositoryImpl }
  );
}
