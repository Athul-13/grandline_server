import { injectable, inject } from 'tsyringe';
import { IUpdateReservationItineraryUseCase, ItineraryStopUpdateData } from '../../../interface/admin/reservation/update_reservation_itinerary_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { ReservationItinerary } from '../../../../../domain/entities/reservation_itinerary.entity';
import { NotificationType, ERROR_MESSAGES, ReservationStatus, StopType } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for updating reservation itinerary
 * Admin can update itinerary stops and notify user
 */
@injectable()
export class UpdateReservationItineraryUseCase implements IUpdateReservationItineraryUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
  ) {}

  async execute(
    reservationId: string,
    stops: ItineraryStopUpdateData[],
    adminUserId: string
  ): Promise<Reservation> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!stops || stops.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ITINERARY_STOPS', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Check if reservation can be modified
    if (!reservation.canBeModified()) {
      throw new AppError(
        'Reservation cannot be modified',
        'RESERVATION_NOT_MODIFIABLE',
        400
      );
    }

    // Fetch existing itinerary
    const existingStops = await this.itineraryRepository.findByReservationId(reservationId);
    const previousStopCount = existingStops.length;

    // Delete existing itinerary stops
    await this.itineraryRepository.deleteByReservationId(reservationId);

    // Create new itinerary stops
    const newStops: ReservationItinerary[] = [];
    for (const stopData of stops) {
      const itineraryId = stopData.itineraryId || randomUUID();
      const now = new Date();
      const itineraryStop = new ReservationItinerary(
        itineraryId,
        reservationId,
        stopData.tripType,
        stopData.stopOrder,
        stopData.locationName,
        stopData.latitude,
        stopData.longitude,
        stopData.arrivalTime,
        stopData.stopType as StopType,
        now,
        now,
        stopData.departureTime,
        stopData.isDriverStaying,
        stopData.stayingDuration
      );
      newStops.push(itineraryStop);
      await this.itineraryRepository.create(itineraryStop);
    }

    // Update reservation status
    await this.reservationRepository.updateById(reservationId, {
      status: reservation.status === ReservationStatus.CONFIRMED ? ReservationStatus.MODIFIED : reservation.status,
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'other',
      `Itinerary updated: ${previousStopCount} -> ${stops.length} stop(s)`,
      previousStopCount.toString(),
      stops.length.toString(),
      {
        modificationType: 'itinerary_update',
        previousStopCount,
        newStopCount: stops.length,
        updatedStops: stops.map((s) => ({
          locationName: s.locationName,
          tripType: s.tripType,
          stopOrder: s.stopOrder,
        })),
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.ITINERARY_UPDATED,
        title: 'Itinerary Updated for Your Reservation',
        message: `The itinerary for your reservation has been updated with ${stops.length} stop(s)`,
        data: {
          reservationId,
          stopCount: stops.length,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for itinerary update: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(`Admin updated itinerary for reservation: ${reservationId}`);

    return updatedReservation;
  }
}

