import { injectable, inject } from 'tsyringe';
import { IAdjustReservationVehiclesUseCase, VehicleAdjustmentData } from '../../../interface/admin/reservation/adjust_reservation_vehicles_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { IReservationChargeRepository } from '../../../../../domain/repositories/reservation_charge_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IVehicleRepository } from '../../../../../domain/repositories/vehicle_repository.interface';
import { IAmenityRepository } from '../../../../../domain/repositories/amenity_repository.interface';
import { IPricingConfigRepository } from '../../../../../domain/repositories/pricing_config_repository.interface';
import { IPricingCalculationService } from '../../../../../domain/services/pricing_calculation_service.interface';
import { IDriverRepository } from '../../../../../domain/repositories/driver_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { IEmailService } from '../../../../../domain/services/email_service.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS, SERVICE_TOKENS } from '../../../../di/tokens';
import { EmailType, PaymentRequiredEmailData } from '../../../../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../../../../shared/config';
import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';
import { NotificationType, ERROR_MESSAGES, ReservationStatus, TripType } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { ISocketEventService } from '../../../../../domain/services/socket_event_service.interface';
import { randomUUID } from 'crypto';
import { QuoteItinerary } from '../../../../../domain/entities/quote_itinerary.entity';

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
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(SERVICE_TOKENS.IPricingCalculationService)
    private readonly pricingCalculationService: IPricingCalculationService,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
    @inject(SERVICE_TOKENS.ISocketEventService)
    private readonly socketEventService: ISocketEventService
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

    // Calculate additional charge if vehicles changed
    let additionalChargeAmount = 0;
    let chargeDescription = '';
    
    try {
      // Fetch required data for pricing calculation
      const [itineraryStops, pricingConfig, driver] = await Promise.all([
        this.itineraryRepository.findByReservationIdOrdered(reservationId),
        this.pricingConfigRepository.findActive(),
        reservation.assignedDriverId
          ? this.driverRepository.findById(reservation.assignedDriverId)
          : Promise.resolve(null),
      ]);

      if (pricingConfig && itineraryStops.length > 0 && reservation.routeData) {
        // Get new vehicles with full details
        const newVehicleIds = vehicles.map((v) => v.vehicleId);
        const newVehicles = await Promise.all(
          newVehicleIds.map((id) => this.vehicleRepository.findById(id))
        );

        const vehiclesWithQuantity: Array<{ vehicle: import('../../../../../domain/entities/vehicle.entity').Vehicle; quantity: number }> = [];
        for (let i = 0; i < newVehicles.length; i++) {
          const vehicle = newVehicles[i];
          if (!vehicle) {
            throw new AppError(`Vehicle not found: ${newVehicleIds[i]}`, 'VEHICLE_NOT_FOUND', 404);
          }
          vehiclesWithQuantity.push({
            vehicle,
            quantity: vehicles[i].quantity,
          });
        }

        // Get amenities
        let selectedAmenities: import('../../../../../domain/entities/amenity.entity').Amenity[] = [];
        if (reservation.selectedAmenities && reservation.selectedAmenities.length > 0) {
          selectedAmenities = await this.amenityRepository.findByIds(reservation.selectedAmenities);
        }

        // Convert reservation itinerary to quote itinerary format for pricing calculation
        const outboundItinerary = itineraryStops
          .filter((stop) => stop.tripType === 'outbound')
          .map((stop) => ({
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

        const returnItinerary = reservation.tripType === TripType.TWO_WAY
          ? itineraryStops
              .filter((stop) => stop.tripType === 'return')
              .map((stop) => ({
                stopOrder: stop.stopOrder,
                locationName: stop.locationName,
                latitude: stop.latitude,
                longitude: stop.longitude,
                arrivalTime: stop.arrivalTime,
                departureTime: stop.departureTime,
                stopType: stop.stopType,
                isDriverStaying: stop.isDriverStaying,
                stayingDuration: stop.stayingDuration,
              }))
          : undefined;

        // Calculate driver charge
        const totalDuration = (reservation.routeData.outbound?.totalDuration ?? 0) +
          (reservation.routeData.return?.totalDuration ?? 0);
        const driverRate = driver?.salary ?? pricingConfig.averageDriverPerHourRate;
        const driverCharge = this.pricingCalculationService.calculateDriverCharge(
          totalDuration,
          driverRate
        );

        // Calculate new pricing with new vehicles
        const pricingBreakdown = this.pricingCalculationService.calculatePricing({
          selectedVehicles: vehiclesWithQuantity,
          selectedAmenities,
          itinerary: {
            outbound: outboundItinerary as QuoteItinerary[],
            return: returnItinerary as QuoteItinerary[],
          },
          pricingConfig,
          tripType: reservation.tripType,
          routeData: reservation.routeData,
        });

        const newSubtotal =
          (pricingBreakdown.baseFare ?? 0) +
          (pricingBreakdown.distanceFare ?? 0) +
          driverCharge +
          (pricingBreakdown.nightCharge ?? 0) +
          (pricingBreakdown.amenitiesTotal ?? 0);

        const newTax = this.pricingCalculationService.calculateTax(newSubtotal, pricingConfig.taxPercentage);
        const newTotal = newSubtotal + newTax;

        // Compare with original pricing
        const originalTotal = reservation.originalPricing?.total ?? 0;
        const priceDifference = newTotal - originalTotal;

        if (priceDifference > 0) {
          // Additional charge needed
          additionalChargeAmount = Math.round(priceDifference);
          chargeDescription = `Vehicle adjustment: Additional charge for upgraded vehicles (${previousVehicles.length} -> ${vehicles.length} vehicle(s))`;
        } else if (priceDifference < 0) {
          // Refund scenario (negative charge, but we'll handle this separately if needed)
          // For now, we'll just log it - refunds should be processed separately
          logger.info(
            `Vehicle adjustment results in price reduction of ${Math.abs(priceDifference)} for reservation ${reservationId}. Consider processing refund separately.`
          );
        }
      }
    } catch (pricingError) {
      logger.error(
        `Failed to calculate pricing for vehicle adjustment: ${pricingError instanceof Error ? pricingError.message : 'Unknown error'}. Proceeding without charge calculation.`
      );
      // Continue without charge calculation - don't block the vehicle adjustment
    }

    // Update reservation
    await this.reservationRepository.updateById(reservationId, {
      selectedVehicles: vehicles,
      status: reservation.status === ReservationStatus.CONFIRMED ? ReservationStatus.MODIFIED : reservation.status,
    } as Partial<import('../../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel>);

    // Create charge record if additional charge is needed
    let chargeId: string | undefined;
    if (additionalChargeAmount > 0) {
      chargeId = randomUUID();
      const charge = new ReservationCharge(
        chargeId,
        reservationId,
        'vehicle_upgrade',
        chargeDescription,
        additionalChargeAmount,
        reservation.originalPricing?.currency || 'INR',
        adminUserId,
        false // Not paid yet
      );
      await this.chargeRepository.create(charge);
      logger.info(
        `Created additional charge of ${additionalChargeAmount} ${reservation.originalPricing?.currency || 'INR'} for vehicle adjustment on reservation: ${reservationId}`
      );

      // Send payment required email to user
      try {
        const user = await this.userRepository.findById(reservation.userId);
        if (user && chargeId) {
          const paymentLink = `${FRONTEND_CONFIG.URL}/reservations/${reservationId}/charges/${chargeId}/pay`;
          const viewReservationLink = `${FRONTEND_CONFIG.URL}/reservations/${reservationId}`;

          const emailData: PaymentRequiredEmailData = {
            email: user.email,
            fullName: user.fullName,
            reservationNumber: reservation.reservationNumber,
            chargeId,
            chargeDescription,
            amount: additionalChargeAmount,
            currency: reservation.originalPricing?.currency || 'INR',
            chargeType: 'vehicle_upgrade',
            tripName: reservation.tripName,
            tripType: reservation.tripType,
            paymentLink,
            viewReservationLink,
          };

          await this.emailService.sendEmail(EmailType.PAYMENT_REQUIRED, emailData);
          logger.info(`Payment required email sent to user ${user.email} for charge ${chargeId}`);
        }
      } catch (emailError) {
        logger.error(
          `Failed to send payment required email: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
        );
        // Don't throw - email failure shouldn't block vehicle adjustment
      }
    }

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
      const notificationMessage = additionalChargeAmount > 0
        ? `The vehicles for your reservation have been adjusted. An additional charge of ${additionalChargeAmount} ${reservation.originalPricing?.currency || 'INR'} has been added.`
        : `The vehicles for your reservation have been adjusted`;

      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_VEHICLES_ADJUSTED,
        title: 'Vehicles Adjusted for Your Reservation',
        message: notificationMessage,
        data: {
          reservationId,
          vehicleCount: vehicles.length,
          additionalCharge: additionalChargeAmount > 0 ? additionalChargeAmount : undefined,
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

    // Emit vehicle changed event for real-time updates
    try {
      await this.socketEventService.emitVehicleChanged({
        reservationId,
        assignedDriverId: updatedReservation.assignedDriverId,
        vehicles: vehicles.map((v) => ({
          vehicleId: v.vehicleId,
          quantity: v.quantity,
        })),
      });
    } catch (socketError: unknown) {
      // Don't fail vehicle adjustment if socket event fails
      logger.error(
        `Error emitting vehicle changed event: ${socketError instanceof Error ? socketError.message : 'Unknown error'}`
      );
    }

    logger.info(`Admin adjusted vehicles for reservation: ${reservationId}`);

    return updatedReservation;
  }
}

