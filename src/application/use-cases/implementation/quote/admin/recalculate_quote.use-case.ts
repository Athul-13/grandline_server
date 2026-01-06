import { inject, injectable } from 'tsyringe';
import { IRecalculateQuoteUseCase } from '../../../interface/quote/admin/recalculate_quote_use_case.interface';
import { RecalculateQuoteResponse } from '../../../../dtos/quote.dto';
import { IQuoteRepository } from '../../../../../domain/repositories/quote_repository.interface';
import { IDriverRepository } from '../../../../../domain/repositories/driver_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IQuoteItineraryRepository } from '../../../../../domain/repositories/quote_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../../domain/repositories/passenger_repository.interface';
import { IVehicleRepository } from '../../../../../domain/repositories/vehicle_repository.interface';
import { IAmenityRepository } from '../../../../../domain/repositories/amenity_repository.interface';
import { IPricingConfigRepository } from '../../../../../domain/repositories/pricing_config_repository.interface';
import { IPricingCalculationService } from '../../../../../domain/services/pricing_calculation_service.interface';
import { IPDFGenerationService } from '../../../../../domain/services/pdf_generation_service.interface';
import { IEmailService } from '../../../../../domain/services/email_service.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../di/tokens';
import { QuoteMapper } from '../../../../mapper/quote.mapper';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES, TripType } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { Quote } from '../../../../../domain/entities/quote.entity';
import { EmailType, QuoteEmailData } from '../../../../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../../../../shared/config';
import { Vehicle } from '../../../../../domain/entities/vehicle.entity';
import { Amenity } from '../../../../../domain/entities/amenity.entity';
import { Driver } from '../../../../../domain/entities/driver.entity';
import { canAssignDriverToQuote } from '../../../../../shared/utils/driver_assignment.util';
import { ISocketEventService } from '../../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for recalculating quote pricing
 * Checks driver and vehicle availability, recalculates pricing, and sends updated quotation
 */
@injectable()
export class RecalculateQuoteUseCase implements IRecalculateQuoteUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository,
    @inject(SERVICE_TOKENS.IPricingCalculationService)
    private readonly pricingCalculationService: IPricingCalculationService,
    @inject(SERVICE_TOKENS.IPDFGenerationService)
    private readonly pdfGenerationService: IPDFGenerationService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService
  ) {}

  async execute(quoteId: string): Promise<RecalculateQuoteResponse> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      logger.info(`Recalculating quote: ${quoteId}`);

      // Get quote
      const quote = await this.quoteRepository.findById(quoteId);
      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Verify quote is in QUOTED status
      if (quote.status !== QuoteStatus.QUOTED) {
        throw new AppError(
          'Quote must be in QUOTED status to recalculate',
          'INVALID_QUOTE_STATUS',
          400
        );
      }

      // Get itinerary to determine date range
      const itinerary = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
      if (itinerary.length === 0) {
        throw new AppError(ERROR_MESSAGES.ITINERARY_REQUIRED, 'ITINERARY_NOT_FOUND', 404);
      }

      // Get date range from itinerary
      const arrivalTimes = itinerary.map((stop) => stop.arrivalTime);
      const minDate = new Date(Math.min(...arrivalTimes.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...arrivalTimes.map((d) => d.getTime())));

      // Check vehicle availability
      if (!quote.selectedVehicles || quote.selectedVehicles.length === 0) {
        throw new AppError(ERROR_MESSAGES.VEHICLES_REQUIRED, 'VEHICLES_REQUIRED', 400);
      }

      const bookedVehicleIds = await this.quoteRepository.findBookedVehicleIdsInDateRange(
        minDate,
        maxDate,
        quoteId // Exclude current quote
      );

      // Check if any selected vehicles are no longer available
      const unavailableVehicles: string[] = [];
      for (const selectedVehicle of quote.selectedVehicles) {
        if (bookedVehicleIds.has(selectedVehicle.vehicleId)) {
          unavailableVehicles.push(selectedVehicle.vehicleId);
        }
      }

      if (unavailableVehicles.length > 0) {
        // Vehicles not available - notify user to select new vehicles
        logger.warn(
          `Quote ${quoteId} recalculation failed: vehicles ${unavailableVehicles.join(', ')} are no longer available`
        );

        return {
          success: false,
          message: ERROR_MESSAGES.VEHICLES_NOT_AVAILABLE,
          requiresVehicleReselection: true,
        };
      }

      // Vehicles are available - proceed with recalculation
      // Check if assigned driver is still available
      let driverToUse: Driver | null = null;
      let driverIdToAssign: string | undefined;

      if (quote.assignedDriverId) {
        // Check if current driver is still available (within 24 hours)
        if (quote.isWithinPaymentWindow()) {
          // Check if driver is still available for dates
          const bookedDriverIds = await this.quoteRepository.findBookedDriverIdsInDateRange(
            minDate,
            maxDate,
            quoteId
          );

          if (!bookedDriverIds.has(quote.assignedDriverId)) {
            // Current driver is still available - check eligibility
            driverToUse = await this.driverRepository.findById(quote.assignedDriverId);
            if (driverToUse) {
              const now = new Date();
              const eligibility = canAssignDriverToQuote(driverToUse, itinerary, now);
              if (eligibility.canAssign) {
                driverIdToAssign = quote.assignedDriverId;
              } else {
                logger.info(`Quote ${quoteId}: Current driver ${quote.assignedDriverId} not eligible: ${eligibility.reason}`);
                driverToUse = null; // Driver not eligible, need to find new one
              }
            }
          }
        }

        // If current driver not available, find a new one
        if (!driverToUse) {
          const availableDrivers = await this.driverRepository.findAvailableDrivers();
          const bookedDriverIds = await this.quoteRepository.findBookedDriverIdsInDateRange(
            minDate,
            maxDate,
            quoteId
          );

          // Filter out booked drivers and check eligibility using the guard
          const now = new Date();
          const trulyAvailableDrivers = availableDrivers.filter((driver) => {
            // Skip if driver is booked in date range
            if (bookedDriverIds.has(driver.driverId)) {
              return false;
            }
            
            // Check eligibility using the guard
            const eligibility = canAssignDriverToQuote(driver, itinerary, now);
            return eligibility.canAssign;
          });

          if (trulyAvailableDrivers.length > 0) {
            // Use first available driver
            driverToUse = trulyAvailableDrivers[0];
            driverIdToAssign = driverToUse.driverId;
            logger.info(
              `Quote ${quoteId}: Current driver not available, using new driver ${driverIdToAssign}`
            );
          } else {
            // No drivers available - this shouldn't happen often, but handle it
            logger.warn(`Quote ${quoteId}: No drivers available for recalculation`);
            throw new AppError(
              'No drivers available for the selected dates. Please try again later.',
              'NO_DRIVERS_AVAILABLE',
              400
            );
          }
        }
      } else {
        // No driver assigned yet - find an available driver
        const availableDrivers = await this.driverRepository.findAvailableDrivers();
        const bookedDriverIds = await this.quoteRepository.findBookedDriverIdsInDateRange(
          minDate,
          maxDate,
          quoteId
        );

        // Filter out booked drivers and check eligibility using the guard
        const now = new Date();
        const trulyAvailableDrivers = availableDrivers.filter((driver) => {
          // Skip if driver is booked in date range
          if (bookedDriverIds.has(driver.driverId)) {
            return false;
          }
          
          // Check eligibility using the guard
          const eligibility = canAssignDriverToQuote(driver, itinerary, now);
          return eligibility.canAssign;
        });

        if (trulyAvailableDrivers.length > 0) {
          driverToUse = trulyAvailableDrivers[0];
          driverIdToAssign = driverToUse.driverId;
        } else {
          throw new AppError(
            'No drivers available for the selected dates. Please try again later.',
            'NO_DRIVERS_AVAILABLE',
            400
          );
        }
      }

      if (!driverToUse || !driverIdToAssign) {
        throw new AppError(
          'Failed to find available driver',
          'DRIVER_NOT_AVAILABLE',
          500
        );
      }

      // Get required data for pricing calculation
      if (!quote.routeData) {
        throw new AppError(ERROR_MESSAGES.ROUTE_CALCULATION_FAILED, ERROR_CODES.ROUTE_CALCULATION_ERROR, 400);
      }

      const outboundItinerary = await this.itineraryRepository.findByQuoteIdAndTripType(quoteId, 'outbound');
      const returnItinerary = quote.tripType === TripType.TWO_WAY
        ? await this.itineraryRepository.findByQuoteIdAndTripType(quoteId, 'return')
        : undefined;

      // Get vehicles
      const vehicleIds = quote.selectedVehicles.map((sv) => sv.vehicleId);
      const vehicles = await Promise.all(
        vehicleIds.map((id) => this.vehicleRepository.findById(id))
      );

      const vehiclesWithQuantity: Array<{ vehicle: Vehicle; quantity: number }> = [];
      for (let i = 0; i < vehicles.length; i++) {
        const vehicle = vehicles[i];
        if (!vehicle) {
          throw new AppError(`Vehicle not found: ${vehicleIds[i]}`, 'VEHICLE_NOT_FOUND', 404);
        }
        vehiclesWithQuantity.push({
          vehicle,
          quantity: quote.selectedVehicles[i].quantity,
        });
      }

      // Get amenities
      let selectedAmenities: Amenity[] = [];
      if (quote.selectedAmenities && quote.selectedAmenities.length > 0) {
        selectedAmenities = await this.amenityRepository.findByIds(quote.selectedAmenities);
      }

      // Get active pricing config
      const pricingConfig = await this.pricingConfigRepository.findActive();
      if (!pricingConfig) {
        throw new AppError(
          ERROR_MESSAGES.PRICING_CONFIG_NOT_FOUND,
          'PRICING_CONFIG_NOT_FOUND',
          500
        );
      }

      // Calculate pricing with actual driver rate
      const totalDuration = (quote.routeData.outbound?.totalDuration ?? 0) +
        (quote.routeData.return?.totalDuration ?? 0);
      const driverCharge = this.pricingCalculationService.calculateDriverCharge(
        totalDuration,
        driverToUse.salary
      );

      // Calculate other pricing components
      const pricingBreakdown = this.pricingCalculationService.calculatePricing({
        selectedVehicles: vehiclesWithQuantity,
        selectedAmenities,
        itinerary: {
          outbound: outboundItinerary,
          return: returnItinerary,
        },
        pricingConfig,
        tripType: quote.tripType,
        routeData: quote.routeData,
      });

      // Override driver charge with actual driver rate
      const subtotal =
        (pricingBreakdown.baseFare ?? 0) +
        (pricingBreakdown.distanceFare ?? 0) +
        driverCharge +
        (pricingBreakdown.nightCharge ?? 0) +
        (pricingBreakdown.amenitiesTotal ?? 0);

      const tax = this.pricingCalculationService.calculateTax(subtotal, pricingConfig.taxPercentage);
      const total = subtotal + tax;

      // Check if driver changed (new assignment)
      const driverChanged = quote.assignedDriverId !== driverIdToAssign;

      // Update quote with new pricing and driver (if changed)
      const quotedAt = new Date();
      await this.quoteRepository.updateById(quoteId, {
        assignedDriverId: driverIdToAssign,
        actualDriverRate: driverToUse.salary,
        pricing: {
          fuelPriceAtTime: pricingBreakdown.fuelPriceAtTime,
          averageDriverRateAtTime: pricingConfig.averageDriverPerHourRate,
          taxPercentageAtTime: pricingConfig.taxPercentage,
          baseFare: pricingBreakdown.baseFare ?? 0,
          distanceFare: pricingBreakdown.distanceFare ?? 0,
          driverCharge,
          fuelMaintenance: pricingBreakdown.fuelMaintenance ?? 0,
          nightCharge: pricingBreakdown.nightCharge ?? 0,
          amenitiesTotal: pricingBreakdown.amenitiesTotal ?? 0,
          subtotal,
          tax,
          total,
        },
        pricingLastUpdatedAt: quotedAt,
        quotedAt, // Reset quotedAt to extend payment window
      } as Partial<Quote>);

      // Update driver's lastAssignedAt for fair assignment (only if driver changed)
      if (driverChanged) {
        try {
          await this.driverRepository.updateLastAssignedAt(driverIdToAssign, quotedAt);
        } catch (updateError) {
          // Log error but don't fail recalculation
          logger.error(
            `Error updating lastAssignedAt for driver ${driverIdToAssign}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`
          );
        }
      }

      // Fetch updated quote
      const updatedQuote = await this.quoteRepository.findById(quoteId);
      if (!updatedQuote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Get user for email
      const user = await this.userRepository.findById(quote.userId);
      if (!user) {
        throw new AppError(ERROR_MESSAGES.USER_NOT_FOUND, 'USER_NOT_FOUND', 404);
      }

      // Generate new PDF
      const pdfBuffer = await this.pdfGenerationService.generateQuotePDF({
        quote: updatedQuote,
        itinerary,
        driver: driverToUse,
        user,
      });

      // Prepare email data
      const paymentLink = `${FRONTEND_CONFIG.URL}/payment/${quoteId}`;
      const viewQuoteLink = `${FRONTEND_CONFIG.URL}/quotes/${quoteId}`;

      const emailData: QuoteEmailData = {
        email: user.email,
        fullName: user.fullName,
        quoteNumber: updatedQuote.quoteNumber,
        tripName: updatedQuote.tripName,
        tripType: updatedQuote.tripType === TripType.ONE_WAY ? 'one_way' : 'two_way',
        totalPrice: total,
        quoteDate: quotedAt,
        viewQuoteLink,
        paymentLink,
      };

      // Send email with new PDF
      try {
        await this.emailService.sendEmail(EmailType.QUOTE, emailData, [
          {
            filename: `quotation-${quoteId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]);
        logger.info(`Recalculated quote email with PDF sent to ${user.email} for quote: ${quoteId}`);
      } catch (emailError) {
        logger.error(
          `Failed to send recalculated quote email for quote ${quoteId}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
        );
        // Don't fail the recalculation if email fails
      }

      // Emit driver assigned notification (only if driver changed)
      if (driverChanged) {
        try {
          const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
          socketEventService.emitDriverAssigned({
            quoteId,
            tripName: updatedQuote.tripName || 'Trip',
            driverId: driverIdToAssign,
            driverName: driverToUse.fullName,
            userId: quote.userId,
          });
        } catch (notificationError) {
          // Don't fail recalculation if notification fails
          logger.error(
            `Error emitting driver assigned notification: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
          );
        }
      }

      // Fetch itinerary and passengers for response
      const itineraryStops = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
      const passengers = await this.passengerRepository.findByQuoteId(quoteId);

      logger.info(`Quote ${quoteId} recalculated successfully with driver ${driverIdToAssign}`);

      return {
        success: true,
        message: 'Quote recalculated successfully',
        quote: QuoteMapper.toQuoteResponse(updatedQuote, itineraryStops, passengers),
      };
    } catch (error) {
      logger.error(
        `Error recalculating quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to recalculate quote', 'QUOTE_RECALCULATION_ERROR', 500);
    }
  }
}
