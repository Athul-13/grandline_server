import { inject, injectable } from 'tsyringe';
import { IStartTripUseCase } from '../../interface/driver/start_trip_use_case.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationStatus, ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

const TERMINAL_STATUSES = new Set<ReservationStatus>([
  ReservationStatus.CANCELLED,
  ReservationStatus.COMPLETED,
  ReservationStatus.REFUNDED,
]);

/**
 * Use case for starting a trip
 * Driver explicitly starts a trip, setting startedAt timestamp
 */
@injectable()
export class StartTripUseCase implements IStartTripUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(driverId: string, reservationId: string): Promise<Reservation> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_DRIVER_ID', 400);
    }

    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate driver assignment
    if (!reservation.assignedDriverId || reservation.assignedDriverId !== driverId) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Validate reservation is not terminal
    if (TERMINAL_STATUSES.has(reservation.status)) {
      throw new AppError(
        `Cannot start trip. Reservation is ${reservation.status}`,
        'RESERVATION_TERMINAL',
        400
      );
    }

    // Validate trip is not already started
    if (reservation.startedAt) {
      throw new AppError('Trip has already been started', 'TRIP_ALREADY_STARTED', 400);
    }

    // Validate driver doesn't have another active trip
    const driverReservations = await this.reservationRepository.findByAssignedDriverId(driverId);
    const activeTrip = driverReservations.find(
      (r) => r.startedAt && !r.completedAt && r.reservationId !== reservationId
    );

    if (activeTrip) {
      throw new AppError(
        'Driver already has an active trip. Please end the current trip before starting a new one.',
        'DRIVER_HAS_ACTIVE_TRIP',
        400
      );
    }

    // Update reservation with startedAt
    const now = new Date();
    const update: Partial<import('../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel> = {
      startedAt: now,
    };

    await this.reservationRepository.updateById(reservationId, update);

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Emit socket event
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      await socketEventService.emitTripStarted(updatedReservation.reservationId, driverId);
    } catch (error) {
      // Don't fail trip start if socket emission fails
      logger.error('Error emitting trip started event:', error);
    }

    logger.info(`Driver ${driverId} started trip: ${reservationId}`);

    return updatedReservation;
  }
}

