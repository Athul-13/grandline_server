import { inject, injectable } from 'tsyringe';
import { IUpdateLocationUseCase, LocationUpdatePayload } from '../../interface/driver/update_location_use_case.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { ReservationStatus, ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { IRedisConnection } from '../../../../domain/services/redis_connection.interface';
import { CONFIG_TOKENS } from '../../../../infrastructure/di/tokens';
import { container } from 'tsyringe';

const TERMINAL_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED,
  ReservationStatus.REFUNDED,
]);

const DEFAULT_THROTTLE_INTERVAL_SECONDS = 5;
const LOCATION_TTL_SECONDS = 24 * 60 * 60; // 24 hours

/**
 * Use case for updating driver location during an active trip
 * Validates trip state, enforces throttling, stores location, and broadcasts updates
 */
@injectable()
export class UpdateLocationUseCase implements IUpdateLocationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(driverId: string, payload: LocationUpdatePayload): Promise<void> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_DRIVER_ID', 400);
    }

    if (!payload.reservationId || typeof payload.reservationId !== 'string' || payload.reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (typeof payload.latitude !== 'number' || isNaN(payload.latitude) || payload.latitude < -90 || payload.latitude > 90) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_LATITUDE', 400);
    }

    if (typeof payload.longitude !== 'number' || isNaN(payload.longitude) || payload.longitude < -180 || payload.longitude > 180) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_LONGITUDE', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(payload.reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate driver assignment
    if (!reservation.assignedDriverId || reservation.assignedDriverId !== driverId) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate trip is started
    if (!reservation.startedAt) {
      throw new AppError('Trip has not been started yet', 'TRIP_NOT_STARTED', 400);
    }

    // Validate trip is not completed
    if (reservation.completedAt) {
      throw new AppError('Trip has already been completed', 'TRIP_ALREADY_COMPLETED', 400);
    }

    // Validate reservation is not terminal
    if (TERMINAL_STATUSES.has(reservation.status)) {
      throw new AppError(
        `Cannot update location. Reservation is ${reservation.status}`,
        'RESERVATION_TERMINAL',
        400
      );
    }

    // Enforce throttling
    const redis = container.resolve<IRedisConnection>(CONFIG_TOKENS.RedisConnection);
    const throttleKey = `location:throttle:${driverId}:${payload.reservationId}`;
    const lastUpdate = await redis.get(throttleKey);

    if (lastUpdate) {
      const lastUpdateTime = parseInt(lastUpdate, 10);
      const now = Date.now();
      const elapsed = (now - lastUpdateTime) / 1000; // seconds

      if (elapsed < DEFAULT_THROTTLE_INTERVAL_SECONDS) {
        // Silently reject (throttled)
        logger.debug(
          `Location update throttled for driver ${driverId}, reservation ${payload.reservationId}. Elapsed: ${elapsed}s`
        );
        throw new AppError('Location update rate limit exceeded', 'LOCATION_UPDATE_THROTTLED', 429);
      }
    }

    // Update throttle timestamp
    await redis.setex(throttleKey, DEFAULT_THROTTLE_INTERVAL_SECONDS, Date.now().toString());

    // Prepare location data
    const now = new Date();
    const locationData = {
      reservationId: payload.reservationId,
      driverId,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: payload.accuracy,
      heading: payload.heading,
      speed: payload.speed,
      timestamp: now.toISOString(),
    };

    // Store latest location in Redis
    const latestLocationKey = `location:latest:${payload.reservationId}`;
    await redis.setex(latestLocationKey, LOCATION_TTL_SECONDS, JSON.stringify(locationData));

    logger.debug(
      `Location updated for driver ${driverId}, reservation ${payload.reservationId}: ${payload.latitude}, ${payload.longitude}`
    );

    // Broadcast location update
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      await socketEventService.emitLocationUpdate(locationData);
    } catch (error) {
      // Don't fail location update if broadcast fails
      logger.error('Error broadcasting location update:', error);
    }
  }
}

