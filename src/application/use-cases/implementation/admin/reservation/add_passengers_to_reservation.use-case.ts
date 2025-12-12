import { injectable, inject } from 'tsyringe';
import { IAddPassengersToReservationUseCase, PassengerData } from '../../../interface/admin/reservation/add_passengers_to_reservation_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { IPassengerRepository } from '../../../../../domain/repositories/passenger_repository.interface';
import { IVehicleRepository } from '../../../../../domain/repositories/vehicle_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { Passenger } from '../../../../../domain/entities/passenger.entity';
import { NotificationType, ERROR_MESSAGES, ReservationStatus } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for adding passengers to reservation
 * Admin can add passengers and notify user
 */
@injectable()
export class AddPassengersToReservationUseCase implements IAddPassengersToReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
  ) {}

  async execute(
    reservationId: string,
    passengers: PassengerData[],
    adminUserId: string
  ): Promise<Reservation> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!passengers || passengers.length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_PASSENGERS', 400);
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

    // Validate vehicle capacity
    const currentCount = reservation.passengerCount || 0;
    const newCount = currentCount + passengers.length;

    if (reservation.selectedVehicles && reservation.selectedVehicles.length > 0) {
      // Calculate total vehicle capacity
      let totalCapacity = 0;
      const vehicleIds = reservation.selectedVehicles.map((v) => v.vehicleId);
      const vehicles = await Promise.all(
        vehicleIds.map((id) => this.vehicleRepository.findById(id))
      );

      for (let i = 0; i < reservation.selectedVehicles.length; i++) {
        const vehicle = vehicles[i];
        if (vehicle) {
          totalCapacity += vehicle.capacity * reservation.selectedVehicles[i].quantity;
        }
      }

      // Check if new passenger count exceeds capacity
      if (newCount > totalCapacity) {
        const excess = newCount - totalCapacity;
        logger.warn(
          `Adding ${passengers.length} passengers would exceed vehicle capacity by ${excess}. Current capacity: ${totalCapacity}, New total: ${newCount}`
        );

        // Suggest vehicle adjustments (find vehicles that can accommodate the excess)
        const availableVehicles = await this.vehicleRepository.findAll();
        const suitableVehicles = availableVehicles
          .filter((v) => v.capacity >= excess && v.isAvailable())
          .sort((a, b) => a.capacity - b.capacity) // Sort by capacity ascending to find smallest suitable vehicle
          .slice(0, 3); // Get top 3 suggestions

        const suggestionMessage = suitableVehicles.length > 0
          ? ` Consider adding ${Math.ceil(excess / suitableVehicles[0].capacity)} vehicle(s) of capacity ${suitableVehicles[0].capacity} or higher.`
          : ' Please adjust vehicles manually to accommodate the additional passengers.';

        throw new AppError(
          `Adding ${passengers.length} passenger(s) would exceed current vehicle capacity by ${excess} passenger(s). Current capacity: ${totalCapacity}, Required: ${newCount}.${suggestionMessage}`,
          'VEHICLE_CAPACITY_EXCEEDED',
          400
        );
      }
    }

    // Create passenger entities and save
    const now = new Date();
    const createdPassengers: Passenger[] = [];

    for (const passengerData of passengers) {
      const passengerId = randomUUID();
      const passenger = new Passenger(
        passengerId,
        passengerData.fullName,
        passengerData.phoneNumber,
        passengerData.age,
        now,
        now,
        undefined, // quoteId
        reservationId // reservationId
      );
      await this.passengerRepository.create(passenger);
      createdPassengers.push(passenger);
    }

    // Update reservation passenger count (newCount already calculated above during validation)
    await this.reservationRepository.updateById(reservationId, {
      passengerCount: newCount,
      status: reservation.status === ReservationStatus.CONFIRMED ? ReservationStatus.MODIFIED : reservation.status,
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'passenger_add',
      `Added ${passengers.length} passenger(s) to reservation`,
      currentCount.toString(),
      newCount.toString(),
      {
        addedPassengers: passengers.map((p) => ({
          fullName: p.fullName,
          phoneNumber: p.phoneNumber,
          age: p.age,
        })),
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_PASSENGERS_ADDED,
        title: 'Passengers Added to Reservation',
        message: `${passengers.length} passenger(s) have been added to your reservation`,
        data: {
          reservationId,
          passengerCount: passengers.length,
          totalPassengers: newCount,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for passenger addition: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    // Fetch and return updated reservation
    const updatedReservation = await this.reservationRepository.findById(reservationId);
    if (!updatedReservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    logger.info(`Admin added ${passengers.length} passenger(s) to reservation: ${reservationId}`);

    return updatedReservation;
  }
}

