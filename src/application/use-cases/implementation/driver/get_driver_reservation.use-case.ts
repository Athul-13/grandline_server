import { inject, injectable } from 'tsyringe';
import { IGetDriverReservationUseCase } from '../../interface/driver/get_driver_reservation_use_case.interface';
import { DriverReservationDetailsResponse } from '../../../dtos/driver_reservation.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IReservationItineraryRepository } from '../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { DriverReservationMapper, VehicleWithQuantity } from '../../../mapper/driver_reservation.mapper';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { ReservationItinerary } from '../../../../domain/entities/reservation_itinerary.entity';

/**
 * Use case for getting driver reservation details
 * Verifies driver assignment before returning
 */
@injectable()
export class GetDriverReservationUseCase implements IGetDriverReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository
  ) {}

  async execute(driverId: string, reservationId: string): Promise<DriverReservationDetailsResponse> {
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
      // Return 404 to avoid leaking existence
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Verify driver assignment (access control)
    if (reservation.assignedDriverId !== driverId) {
      // Return 404 to avoid leaking existence
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    const now = new Date();

    // Fetch full itinerary (all stops, ordered)
    let itineraryStops: ReservationItinerary[] = [];
    try {
      itineraryStops = await this.itineraryRepository.findByReservationIdOrdered(reservationId);
    } catch (itineraryError) {
      logger.error(
        `Failed to fetch itinerary for reservation ${reservationId}: ${itineraryError instanceof Error ? itineraryError.message : 'Unknown error'}`
      );
      // Don't fail reservation fetch if itinerary fetch fails
    }

    // Fetch rider (user) information
    const rider = await this.userRepository.findById(reservation.userId);
    if (!rider) {
      logger.error(`User not found for reservation: ${reservationId}, userId: ${reservation.userId}`);
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Fetch and expand vehicle details
    const vehicleIds = reservation.selectedVehicles?.map((sv) => sv.vehicleId) ?? [];
    const vehiclesById = await this.vehicleRepository.findByIds(vehicleIds);
    const expandedVehicles: VehicleWithQuantity[] = [];
    for (const selectedVehicle of reservation.selectedVehicles ?? []) {
      const vehicle = vehiclesById.get(selectedVehicle.vehicleId);
      if (vehicle) {
        expandedVehicles.push({
          vehicle,
          quantity: selectedVehicle.quantity,
        });
      }
    }

    // Map to driver-safe response DTO
    return DriverReservationMapper.toDriverReservationDetails({
      reservation,
      itineraryStops,
      rider,
      vehicles: expandedVehicles,
      now,
    });
  }
}

