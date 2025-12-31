import { injectable, inject } from 'tsyringe';
import { IGetActiveTripLocationsUseCase, ActiveTripLocation } from '../../../interface/admin/trip/get_active_trip_locations_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IRedisConnection } from '../../../../../domain/services/redis_connection.interface';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { CONFIG_TOKENS } from '../../../../../infrastructure/di/tokens';
import { logger } from '../../../../../shared/logger';

/**
 * Use case for getting active trip locations
 * Fetches all active trips (started but not completed) and retrieves their latest locations from Redis
 */
@injectable()
export class GetActiveTripLocationsUseCase implements IGetActiveTripLocationsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(CONFIG_TOKENS.RedisConnection)
    private readonly redis: IRedisConnection
  ) {}

  async execute(): Promise<ActiveTripLocation[]> {
    try {
      logger.debug('Fetching active trip locations');

      // Step 1: Find all active trips (startedAt exists and completedAt is null)
      const activeTrips = await this.reservationRepository.findActiveTrips();

      logger.debug(`Found ${activeTrips.length} active trips`);

      // Step 2: For each active trip, read the latest location from Redis
      const locationPromises = activeTrips.map(async (trip) => {
        const locationKey = `location:latest:${trip.reservationId}`;
        const locationData = await this.redis.get(locationKey);

        if (!locationData) {
          // No location data in Redis for this trip
          logger.debug(`No location data found in Redis for reservation ${trip.reservationId}`);
          return null;
        }

        try {
          const parsed = JSON.parse(locationData) as ActiveTripLocation;
          
          // Validate that the location data has required fields
          if (!parsed.reservationId || !parsed.driverId || typeof parsed.latitude !== 'number' || typeof parsed.longitude !== 'number') {
            logger.warn(`Invalid location data for reservation ${trip.reservationId}`);
            return null;
          }

          return parsed;
        } catch (error) {
          logger.error(`Error parsing location data for reservation ${trip.reservationId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          return null;
        }
      });

      // Step 3: Wait for all Redis reads to complete and filter out nulls
      const locations = await Promise.all(locationPromises);
      const validLocations = locations.filter((loc): loc is ActiveTripLocation => loc !== null);

      logger.info(`Retrieved ${validLocations.length} active trip locations from Redis`);

      return validLocations;
    } catch (error) {
      logger.error(
        `Error fetching active trip locations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}

