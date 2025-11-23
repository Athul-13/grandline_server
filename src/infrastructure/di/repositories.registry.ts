import { container } from 'tsyringe';
import { REPOSITORY_TOKENS } from './tokens';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { UserRepositoryImpl } from '../repositories/user.repository';
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

/**
 * Registers all repository dependencies in the DI container
 * Repositories are infrastructure implementations of domain repository interfaces
 */
export function registerRepositories(): void {
  container.register<IUserRepository>(
    REPOSITORY_TOKENS.IUserRepository,
    { useClass: UserRepositoryImpl }
  );

  container.register<IVehicleTypeRepository>(
    REPOSITORY_TOKENS.IVehicleTypeRepository,
    { useClass: VehicleTypeRepositoryImpl }
  );

  container.register<IVehicleRepository>(
    REPOSITORY_TOKENS.IVehicleRepository,
    { useClass: VehicleRepositoryImpl }
  );

  container.register<IAmenityRepository>(
    REPOSITORY_TOKENS.IAmenityRepository,
    { useClass: AmenityRepositoryImpl }
  );

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

  container.register<IPricingConfigRepository>(
    REPOSITORY_TOKENS.IPricingConfigRepository,
    { useClass: PricingConfigRepositoryImpl }
  );

  container.register<IEventTypeRepository>(
    REPOSITORY_TOKENS.IEventTypeRepository,
    { useClass: EventTypeRepositoryImpl }
  );
}
