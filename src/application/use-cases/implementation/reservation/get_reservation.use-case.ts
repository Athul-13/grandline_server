import { injectable, inject } from 'tsyringe';
import { IGetReservationUseCase } from '../../interface/reservation/get_reservation_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IReservationItineraryRepository } from '../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../domain/repositories/passenger_repository.interface';
import { ReservationResponse } from '../../../dtos/reservation.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ReservationMapper } from '../../../mapper/reservation.mapper';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting a reservation by ID
 * Verifies user ownership before returning
 */
@injectable()
export class GetReservationUseCase implements IGetReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository
  ) {}

  async execute(reservationId: string, userId: string): Promise<ReservationResponse> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    // Get reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError(
        'Reservation not found',
        'RESERVATION_NOT_FOUND',
        404
      );
    }

    // Verify ownership
    if (reservation.userId !== userId) {
      throw new AppError(
        'Reservation not found',
        'RESERVATION_NOT_FOUND',
        404
      );
    }

    // Fetch driver details if assigned
    let driverDetails = null;
    if (reservation.assignedDriverId) {
      try {
        const driver = await this.driverRepository.findById(reservation.assignedDriverId);
        if (driver) {
          driverDetails = {
            driverId: driver.driverId,
            fullName: driver.fullName,
            email: driver.email,
            phoneNumber: driver.phoneNumber,
            licenseNumber: driver.licenseNumber,
            profilePictureUrl: driver.profilePictureUrl,
          };
        }
      } catch (driverError) {
        logger.error(
          `Failed to fetch driver details for reservation ${reservationId}: ${driverError instanceof Error ? driverError.message : 'Unknown error'}`
        );
        // Don't fail reservation fetch if driver fetch fails
      }
    }

    // Fetch itinerary
    let itineraryStops: Array<{
      itineraryId: string;
      tripType: 'outbound' | 'return';
      stopOrder: number;
      locationName: string;
      latitude: number;
      longitude: number;
      arrivalTime: Date;
      departureTime?: Date;
      stopType: string;
      isDriverStaying: boolean;
      stayingDuration?: number;
    }> = [];
    try {
      const stops = await this.itineraryRepository.findByReservationIdOrdered(reservationId);
      itineraryStops = stops.map((stop) => ({
        itineraryId: stop.itineraryId,
        tripType: stop.tripType,
        stopOrder: stop.stopOrder,
        locationName: stop.locationName,
        latitude: stop.latitude,
        longitude: stop.longitude,
        arrivalTime: stop.arrivalTime,
        departureTime: stop.departureTime,
        stopType: stop.stopType,
        isDriverStaying: stop.isDriverStaying,
        stayingDuration: stop.stayingDuration,
      }));
    } catch (itineraryError) {
      logger.error(
        `Failed to fetch itinerary for reservation ${reservationId}: ${itineraryError instanceof Error ? itineraryError.message : 'Unknown error'}`
      );
      // Don't fail reservation fetch if itinerary fetch fails
    }

    // Fetch passengers
    let passengers: Array<{
      passengerId: string;
      fullName: string;
      phoneNumber: string;
      age: number;
    }> = [];
    try {
      const passengerEntities = await this.passengerRepository.findByReservationId(reservationId);
      passengers = passengerEntities.map((passenger) => ({
        passengerId: passenger.passengerId,
        fullName: passenger.fullName,
        phoneNumber: passenger.phoneNumber,
        age: passenger.age,
      }));
    } catch (passengerError) {
      logger.error(
        `Failed to fetch passengers for reservation ${reservationId}: ${passengerError instanceof Error ? passengerError.message : 'Unknown error'}`
      );
      // Don't fail reservation fetch if passenger fetch fails
    }

    // Map to response DTO with driver, itinerary, and passengers
    return ReservationMapper.toReservationResponse(reservation, driverDetails, itineraryStops, passengers);
  }
}

