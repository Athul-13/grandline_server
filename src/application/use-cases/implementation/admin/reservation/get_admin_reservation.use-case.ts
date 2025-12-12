import { injectable, inject } from 'tsyringe';
import { IGetAdminReservationUseCase } from '../../../interface/admin/reservation/get_admin_reservation_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../../../domain/repositories/driver_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { IReservationChargeRepository } from '../../../../../domain/repositories/reservation_charge_repository.interface';
import { IPassengerRepository } from '../../../../../domain/repositories/passenger_repository.interface';
import { AdminReservationDetailsResponse, ReservationModificationResponse, ReservationChargeResponse } from '../../../../dtos/reservation.dto';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { ReservationMapper } from '../../../../mapper/reservation.mapper';
import { ERROR_MESSAGES } from '../../../../../shared/constants';
import { logger } from '../../../../../shared/logger';
import { AppError } from '../../../../../shared/utils/app_error.util';

/**
 * Use case for getting admin reservation details
 * Retrieves a single reservation by ID with user information and related data
 */
@injectable()
export class GetAdminReservationUseCase implements IGetAdminReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository
  ) {}

  async execute(reservationId: string): Promise<AdminReservationDetailsResponse> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch reservation (no ownership check for admin)
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      logger.warn(`Admin attempted to get non-existent reservation: ${reservationId}`);
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Fetch user information
    const user = await this.userRepository.findById(reservation.userId);
    if (!user) {
      logger.error(`User not found for reservation: ${reservationId}, userId: ${reservation.userId}`);
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Fetch related data
    const [modifications, charges, passengers] = await Promise.all([
      this.modificationRepository.findByReservationId(reservationId),
      this.chargeRepository.findByReservationId(reservationId),
      this.passengerRepository.findByReservationId(reservationId),
    ]);

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
    }

    // Map to response DTO (with driver and itinerary if available)
    const reservationResponse = ReservationMapper.toReservationResponse(reservation, driverDetails, itineraryStops);
    
    // Map passengers
    const passengerResponses = passengers.map((passenger) => ({
      passengerId: passenger.passengerId,
      fullName: passenger.fullName,
      phoneNumber: passenger.phoneNumber,
      age: passenger.age,
    }));

    // Map modifications
    const modificationResponses: ReservationModificationResponse[] = modifications.map((mod) => ({
      modificationId: mod.modificationId,
      reservationId: mod.reservationId,
      modifiedBy: mod.modifiedBy,
      modificationType: mod.modificationType,
      description: mod.description,
      previousValue: mod.previousValue,
      newValue: mod.newValue,
      metadata: mod.metadata,
      createdAt: mod.createdAt,
    }));

    // Map charges
    const chargeResponses: ReservationChargeResponse[] = charges.map((charge) => ({
      chargeId: charge.chargeId,
      reservationId: charge.reservationId,
      chargeType: charge.chargeType,
      description: charge.description,
      amount: charge.amount,
      currency: charge.currency,
      addedBy: charge.addedBy,
      isPaid: charge.isPaid,
      paidAt: charge.paidAt,
      createdAt: charge.createdAt,
    }));

    // Calculate totals
    const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);
    const unpaidCharges = charges
      .filter((charge) => !charge.isPaid)
      .reduce((sum, charge) => sum + charge.amount, 0);

    // Add user information and related data for admin response
    const adminReservationResponse: AdminReservationDetailsResponse = {
      ...reservationResponse,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      passengers: passengerResponses,
      modifications: modificationResponses,
      charges: chargeResponses,
      totalCharges,
      unpaidCharges,
    };

    logger.info(`Admin retrieved reservation details: ${reservationId}`);
    return adminReservationResponse;
  }
}

