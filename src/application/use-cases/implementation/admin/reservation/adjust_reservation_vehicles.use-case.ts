import { injectable, inject } from 'tsyringe';
import { IAdjustReservationVehiclesUseCase, VehicleAdjustmentData } from '../../../interface/admin/reservation/adjust_reservation_vehicles_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { NotificationType, ERROR_MESSAGES, ReservationStatus } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for adjusting reservation vehicles
 * Admin can change vehicle selection and notify user
 */
@injectable()
export class AdjustReservationVehiclesUseCase implements IAdjustReservationVehiclesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
  ) {}

  async execute(
    reservationId: string,
    vehicles: VehicleAdjustmentData[],
    adminUserId: string
  ): Promise<Reservation> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!vehicles || vehicles.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_VEHICLES', 400);
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

    // Store previous vehicles
    const previousVehicles = reservation.selectedVehicles || [];

    // Update reservation
    await this.reservationRepository.updateById(reservationId, {
      selectedVehicles: vehicles,
      status: reservation.status === ReservationStatus.CONFIRMED ? ReservationStatus.MODIFIED : reservation.status,
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'vehicle_adjust',
      `Vehicles adjusted: ${previousVehicles.length} -> ${vehicles.length} vehicle(s)`,
      JSON.stringify(previousVehicles),
      JSON.stringify(vehicles),
      {
        previousVehicles,
        newVehicles: vehicles,
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_VEHICLES_ADJUSTED,
        title: 'Vehicles Adjusted for Your Reservation',
        message: `The vehicles for your reservation have been adjusted`,
        data: {
          reservationId,
          vehicleCount: vehicles.length,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for vehicle adjustment: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(`Admin adjusted vehicles for reservation: ${reservationId}`);

    return updatedReservation;
  }
}

