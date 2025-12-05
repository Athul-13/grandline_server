import { inject, injectable } from 'tsyringe';
import { IAssignDriverToQuoteUseCase } from '../../../interface/quote/admin/assign_driver_to_quote_use_case.interface';
import { QuoteResponse, AssignDriverToQuoteRequest } from '../../../../dtos/quote.dto';
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

/**
 * Use case for assigning driver to quote
 * Assigns driver, recalculates pricing with actual driver rate, generates PDF, and sends email
 */
@injectable()
export class AssignDriverToQuoteUseCase implements IAssignDriverToQuoteUseCase {
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

  async execute(quoteId: string, request: AssignDriverToQuoteRequest): Promise<QuoteResponse> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      if (!request.driverId || typeof request.driverId !== 'string' || request.driverId.trim().length === 0) {
        throw new AppError('Driver ID is required', 'INVALID_DRIVER_ID', 400);
      }

      logger.info(`Assigning driver ${request.driverId} to quote: ${quoteId}`);

      // Get quote
      const quote = await this.quoteRepository.findById(quoteId);
      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Verify quote is in a valid state for driver assignment
      if (quote.status !== QuoteStatus.SUBMITTED && quote.status !== QuoteStatus.QUOTED) {
        throw new AppError(
          'Quote must be in SUBMITTED or QUOTED status to assign driver',
          'INVALID_QUOTE_STATUS',
          400
        );
      }

      // Check if quote payment window has expired
      if (quote.isPaymentWindowExpired()) {
        throw new AppError(
          'Quote payment window has expired. Please request a new quote.',
          'QUOTE_EXPIRED',
          400
        );
      }

      // Get driver
      const driver = await this.driverRepository.findById(request.driverId);
      if (!driver) {
        throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
      }

      // Check driver availability (check if driver is already assigned to another quote within 24 hours)
      const itinerary = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
      if (itinerary.length === 0) {
        throw new AppError(ERROR_MESSAGES.ITINERARY_REQUIRED, 'ITINERARY_NOT_FOUND', 404);
      }

      // Get date range from itinerary
      const arrivalTimes = itinerary.map((stop) => stop.arrivalTime);
      const minDate = new Date(Math.min(...arrivalTimes.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...arrivalTimes.map((d) => d.getTime())));

      // Check if driver is available for this date range
      const bookedDriverIds = await this.quoteRepository.findBookedDriverIdsInDateRange(
        minDate,
        maxDate,
        quoteId // Exclude current quote
      );

      if (bookedDriverIds.has(request.driverId)) {
        throw new AppError(
          'Driver is not available for the selected dates',
          'DRIVER_NOT_AVAILABLE',
          400
        );
      }

      // Get required data for pricing calculation
      if (!quote.selectedVehicles || quote.selectedVehicles.length === 0) {
        throw new AppError(ERROR_MESSAGES.VEHICLES_REQUIRED, 'VEHICLES_REQUIRED', 400);
      }

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

      // Calculate pricing with actual driver rate (driver.salary is per hour)
      const totalDuration = (quote.routeData.outbound?.totalDuration ?? 0) +
        (quote.routeData.return?.totalDuration ?? 0);
      const driverCharge = this.pricingCalculationService.calculateDriverCharge(
        totalDuration,
        driver.salary
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

      // Update quote with driver assignment and new pricing
      const quotedAt = new Date();
      await this.quoteRepository.updateById(quoteId, {
        status: QuoteStatus.QUOTED,
        assignedDriverId: request.driverId,
        actualDriverRate: driver.salary,
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
        quotedAt,
      } as Partial<Quote>);

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

      // Generate PDF
      const pdfBuffer = await this.pdfGenerationService.generateQuotePDF({
        quote: updatedQuote,
        itinerary,
        driver,
        user,
      });

      // Prepare email data
      const paymentLink = `${FRONTEND_CONFIG.URL}/payment/${quoteId}`;
      const viewQuoteLink = `${FRONTEND_CONFIG.URL}/quotes/${quoteId}`;

      const emailData: QuoteEmailData = {
        email: user.email,
        fullName: user.fullName,
        quoteId: updatedQuote.quoteId,
        tripName: updatedQuote.tripName,
        tripType: updatedQuote.tripType === TripType.ONE_WAY ? 'one_way' : 'two_way',
        totalPrice: total,
        quoteDate: quotedAt,
        viewQuoteLink,
        paymentLink,
      };

      // Send email with PDF attachment
      try {
        await this.emailService.sendEmail(EmailType.QUOTE, emailData, [
          {
            filename: `quotation-${quoteId}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ]);
        logger.info(`Quote email with PDF sent to ${user.email} for quote: ${quoteId}`);
      } catch (emailError) {
        logger.error(
          `Failed to send quote email for quote ${quoteId}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
        );
        // Don't fail the assignment if email fails
      }

      // Fetch itinerary and passengers for response
      const itineraryStops = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
      const passengers = await this.passengerRepository.findByQuoteId(quoteId);

      logger.info(`Driver ${request.driverId} assigned successfully to quote: ${quoteId}`);

      return QuoteMapper.toQuoteResponse(updatedQuote, itineraryStops, passengers);
    } catch (error) {
      logger.error(
        `Error assigning driver to quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to assign driver to quote', 'DRIVER_ASSIGNMENT_ERROR', 500);
    }
  }
}
