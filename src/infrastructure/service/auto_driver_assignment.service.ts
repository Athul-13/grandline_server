import { inject, injectable } from 'tsyringe';
import { IAutoDriverAssignmentService } from '../../domain/services/auto_driver_assignment_service.interface';
import { IQuoteRepository } from '../../domain/repositories/quote_repository.interface';
import { IDriverRepository } from '../../domain/repositories/driver_repository.interface';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { IQuoteItineraryRepository } from '../../domain/repositories/quote_itinerary_repository.interface';
import { IVehicleRepository } from '../../domain/repositories/vehicle_repository.interface';
import { IAmenityRepository } from '../../domain/repositories/amenity_repository.interface';
import { IPricingConfigRepository } from '../../domain/repositories/pricing_config_repository.interface';
import { IPricingCalculationService } from '../../domain/services/pricing_calculation_service.interface';
import { IPDFGenerationService } from '../../domain/services/pdf_generation_service.interface';
import { IEmailService } from '../../domain/services/email_service.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../application/di/tokens';
import { QuoteStatus, TripType } from '../../shared/constants';
import { logger } from '../../shared/logger';
import { Quote } from '../../domain/entities/quote.entity';
import { EmailType, QuoteEmailData } from '../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../shared/config';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { Amenity } from '../../domain/entities/amenity.entity';

/**
 * Auto Driver Assignment Service Implementation
 * Automatically assigns available drivers to quotes
 */
@injectable()
export class AutoDriverAssignmentServiceImpl implements IAutoDriverAssignmentService {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
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

  async tryAssignDriverToQuote(quoteId: string): Promise<boolean> {
    try {
      logger.info(`Attempting to auto-assign driver to quote: ${quoteId}`);

      // Get quote
      const quote = await this.quoteRepository.findById(quoteId);
      if (!quote) {
        logger.warn(`Quote not found for auto-assignment: ${quoteId}`);
        return false;
      }

      // Only process SUBMITTED quotes
      if (quote.status !== QuoteStatus.SUBMITTED) {
        logger.info(`Quote ${quoteId} is not in SUBMITTED status (current: ${quote.status}), skipping auto-assignment`);
        return false;
      }

      // Check if quote already has a driver assigned
      if (quote.assignedDriverId) {
        logger.info(`Quote ${quoteId} already has driver assigned, skipping`);
        return false;
      }

      // Get itinerary to determine date range
      const itinerary = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
      if (itinerary.length === 0) {
        logger.warn(`Quote ${quoteId} has no itinerary, cannot assign driver`);
        return false;
      }

      if (!quote.routeData) {
        logger.warn(`Quote ${quoteId} has no route data, cannot assign driver`);
        return false;
      }

      // Get date range from itinerary
      const arrivalTimes = itinerary.map((stop) => stop.arrivalTime);
      const minDate = new Date(Math.min(...arrivalTimes.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...arrivalTimes.map((d) => d.getTime())));

      // Find available drivers
      const availableDrivers = await this.driverRepository.findAvailableDrivers();
      if (availableDrivers.length === 0) {
        logger.info(`No available drivers found for quote ${quoteId}`);
        return false;
      }

      // Check which drivers are booked in this date range
      const bookedDriverIds = await this.quoteRepository.findBookedDriverIdsInDateRange(
        minDate,
        maxDate,
        quoteId
      );

      // Filter out booked drivers
      const trulyAvailableDrivers = availableDrivers.filter(
        (driver) => !bookedDriverIds.has(driver.driverId)
      );

      if (trulyAvailableDrivers.length === 0) {
        logger.info(`No truly available drivers for quote ${quoteId} date range`);
        return false;
      }

      // Check if vehicles are selected
      if (!quote.selectedVehicles || quote.selectedVehicles.length === 0) {
        logger.warn(`Quote ${quoteId} has no vehicles selected, cannot assign driver`);
        return false;
      }

      // Assign first available driver
      const driver = trulyAvailableDrivers[0];
      logger.info(`Found available driver ${driver.driverId} for quote ${quoteId}`);

      // Get required data for pricing calculation
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
          logger.error(`Vehicle not found: ${vehicleIds[i]} for quote ${quoteId}`);
          return false;
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
        logger.error(`No active pricing config found for quote ${quoteId}`);
        return false;
      }

      // Calculate pricing with actual driver rate
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
        assignedDriverId: driver.driverId,
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

      // Fetch updated quote for PDF generation
      const updatedQuote = await this.quoteRepository.findById(quoteId);
      if (!updatedQuote) {
        logger.error(`Failed to fetch updated quote ${quoteId} after assignment`);
        return false;
      }

      // Get user for email
      const user = await this.userRepository.findById(quote.userId);
      if (!user) {
        logger.error(`User not found for quote ${quoteId}`);
        return false;
      }

      // Generate PDF
      const pdfBuffer = await this.pdfGenerationService.generateQuotePDF({
        quote: updatedQuote,
        itinerary,
        driver,
        user,
      });

      // Prepare email data with payment link
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
        // Don't fail the assignment if email fails - driver is already assigned
      }

      logger.info(`Successfully auto-assigned driver ${driver.driverId} to quote ${quoteId}`);
      return true;
    } catch (error) {
      logger.error(
        `Error in auto-assignment for quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return false;
    }
  }

  async processPendingQuotes(): Promise<number> {
    try {
      logger.info('Processing pending quotes for driver assignment');

      // Find all SUBMITTED quotes without assigned drivers
      const submittedQuotes = await this.quoteRepository.findByStatus(QuoteStatus.SUBMITTED);
      
      if (submittedQuotes.length === 0) {
        logger.info('No pending quotes to process');
        return 0;
      }

      // Filter quotes without assigned drivers
      const quotesNeedingDrivers = submittedQuotes.filter((quote) => !quote.assignedDriverId);

      if (quotesNeedingDrivers.length === 0) {
        logger.info('No quotes needing driver assignment');
        return 0;
      }

      logger.info(`Found ${quotesNeedingDrivers.length} quotes needing driver assignment`);

      let assignedCount = 0;
      for (const quote of quotesNeedingDrivers) {
        const assigned = await this.tryAssignDriverToQuote(quote.quoteId);
        if (assigned) {
          assignedCount++;
        }
        // Small delay to prevent overwhelming the system
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      logger.info(`Successfully assigned drivers to ${assignedCount} out of ${quotesNeedingDrivers.length} quotes`);
      return assignedCount;
    } catch (error) {
      logger.error(
        `Error processing pending quotes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return 0;
    }
  }
}
