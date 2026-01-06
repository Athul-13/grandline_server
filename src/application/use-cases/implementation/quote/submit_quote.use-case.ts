import { inject, injectable } from 'tsyringe';
import { ISubmitQuoteUseCase } from '../../interface/quote/submit_quote_use_case.interface';
import { SubmitQuoteResponse } from '../../../dtos/quote.dto';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { IPricingConfigRepository } from '../../../../domain/repositories/pricing_config_repository.interface';
import { ICalculateQuotePricingUseCase } from '../../interface/quote/calculate_quote_pricing_use_case.interface';
import { IPricingCalculationService } from '../../../../domain/services/pricing_calculation_service.interface';
import { IPDFGenerationService } from '../../../../domain/services/pdf_generation_service.interface';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { IQueueService } from '../../../../domain/services/queue_service.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { QuoteStatus, ERROR_MESSAGES, ERROR_CODES, TripType } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { Quote } from '../../../../domain/entities/quote.entity';
import { EmailType, QuoteEmailData } from '../../../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../../../shared/config';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { Amenity } from '../../../../domain/entities/amenity.entity';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { canAssignDriverToQuote } from '../../../../shared/utils/driver_assignment.util';
import { container } from 'tsyringe';

/**
 * Use case for submitting a quote
 * Changes quote status to submitted and calculates final pricing
 * Allows resubmission of already submitted quotes (e.g., after vehicle changes)
 */
@injectable()
export class SubmitQuoteUseCase implements ISubmitQuoteUseCase {
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
    @inject(USE_CASE_TOKENS.CalculateQuotePricingUseCase)
    private readonly calculateQuotePricingUseCase: ICalculateQuotePricingUseCase,
    @inject(SERVICE_TOKENS.IPricingCalculationService)
    private readonly pricingCalculationService: IPricingCalculationService,
    @inject(SERVICE_TOKENS.IPDFGenerationService)
    private readonly pdfGenerationService: IPDFGenerationService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
    @inject(SERVICE_TOKENS.IQueueService)
    private readonly queueService: IQueueService
  ) {}

  async execute(quoteId: string, userId: string): Promise<SubmitQuoteResponse> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
      }

      logger.info(`Submitting quote: ${quoteId} by user: ${userId}`);

      // Get quote and verify ownership
      const quote = await this.quoteRepository.findById(quoteId);

      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      if (quote.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Verify quote is a draft OR submitted (allow resubmission)
      if (quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.SUBMITTED) {
        throw new AppError(
          ERROR_MESSAGES.QUOTE_ALREADY_SUBMITTED,
          ERROR_CODES.QUOTE_INVALID_STATUS,
          400
        );
      }

      // Verify quote is complete (all 5 steps done)
      if (quote.currentStep !== 5) {
        throw new AppError('Quote is not complete. Please complete all steps before submitting.', 'QUOTE_INCOMPLETE', 400);
      }

      // Calculate pricing
      const pricing = await this.calculateQuotePricingUseCase.execute(quoteId, userId);

      // Try to automatically assign an available driver
      let driverAssigned = false;
      let finalStatus = QuoteStatus.SUBMITTED;

      try {
        // Get itinerary to determine date range
        const itinerary = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
        if (itinerary.length > 0 && quote.routeData) {
          // Get date range from itinerary
          const arrivalTimes = itinerary.map((stop) => stop.arrivalTime);
          const minDate = new Date(Math.min(...arrivalTimes.map((d) => d.getTime())));
          const maxDate = new Date(Math.max(...arrivalTimes.map((d) => d.getTime())));

          // Find available drivers
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

          if (trulyAvailableDrivers.length > 0 && quote.selectedVehicles && quote.selectedVehicles.length > 0) {
            // Assign first available driver
            const driver = trulyAvailableDrivers[0];

            // Get required data for pricing calculation with actual driver rate
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
            if (pricingConfig) {
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

              // Update pricing with actual driver rate
              pricing.driverCharge = driverCharge;
              pricing.subtotal = subtotal;
              pricing.tax = tax;
              pricing.total = total;

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

              // Update driver's lastAssignedAt for fair assignment
              try {
                await this.driverRepository.updateLastAssignedAt(driver.driverId, quotedAt);
              } catch (updateError) {
                // Log error but don't fail assignment
                logger.error(
                  `Error updating lastAssignedAt for driver ${driver.driverId}: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`
                );
              }

              driverAssigned = true;
              finalStatus = QuoteStatus.QUOTED;

              // Schedule expiry job for 24 hours from now
              try {
                await this.queueService.addQuoteExpiryJob(quoteId, quotedAt);
                logger.info(`Quote expiry job scheduled for quote: ${quoteId}`);
              } catch (expiryJobError) {
                // Log error but don't fail quote submission
                logger.error(
                  `Failed to schedule expiry job for quote ${quoteId}: ${expiryJobError instanceof Error ? expiryJobError.message : 'Unknown error'}`
                );
              }

              // Fetch updated quote for PDF generation
              const updatedQuote = await this.quoteRepository.findById(quoteId);
              if (updatedQuote) {
                // Get user for email
                const user = await this.userRepository.findById(userId);
                if (user) {
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
                    quoteNumber: updatedQuote.quoteNumber,
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

                  // Emit driver assigned notification
                  try {
                    const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
                    socketEventService.emitDriverAssigned({
                      quoteId,
                      tripName: updatedQuote.tripName || 'Trip',
                      driverId: driver.driverId,
                      driverName: driver.fullName,
                      userId,
                    });
                  } catch (notificationError) {
                    // Don't fail assignment if notification fails
                    logger.error(
                      `Error emitting driver assigned notification: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
                    );
                  }
                }
              }
            }
          }
        }
      } catch (driverAssignmentError) {
        // Log error but don't fail quote submission
        logger.warn(
          `Failed to auto-assign driver for quote ${quoteId}: ${driverAssignmentError instanceof Error ? driverAssignmentError.message : 'Unknown error'}. Quote will remain in SUBMITTED status for admin review.`
        );
      }

      // If driver not assigned, update quote with pricing and SUBMITTED status
      // No email is sent when driver is not assigned - email will be sent when driver is assigned via queue
      if (!driverAssigned) {
        await this.quoteRepository.updateById(quoteId, {
          status: QuoteStatus.SUBMITTED,
          pricing: {
            fuelPriceAtTime: pricing.fuelPriceAtTime,
            averageDriverRateAtTime: pricing.averageDriverRateAtTime,
            taxPercentageAtTime: pricing.taxPercentageAtTime,
            baseFare: pricing.baseFare,
            distanceFare: pricing.distanceFare,
            driverCharge: pricing.driverCharge,
            fuelMaintenance: pricing.fuelMaintenance,
            nightCharge: pricing.nightCharge,
            amenitiesTotal: pricing.amenitiesTotal,
            subtotal: pricing.subtotal,
            tax: pricing.tax,
            total: pricing.total,
          },
        } as Partial<Quote>);

        // Add job to queue for automatic driver assignment
        try {
          await this.queueService.addDriverAssignmentJob(quoteId);
          logger.info(`Quote ${quoteId} submitted but no driver assigned. Added to queue for automatic assignment.`);
        } catch (queueError) {
          logger.error(
            `Failed to add driver assignment job for quote ${quoteId}: ${queueError instanceof Error ? queueError.message : 'Unknown error'}`
          );
          // Don't fail quote submission if queue job addition fails
        }
      }

      // Fetch updated quote
      const updatedQuote = await this.quoteRepository.findById(quoteId);
      if (!updatedQuote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Emit socket event for admin dashboard
      try {
        const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
        const oldStatus = quote.status;
        socketEventService.emitQuoteStatusChanged(updatedQuote, oldStatus);
      } catch (error) {
        // Don't fail quote submission if socket emission fails
        logger.error('Error emitting quote status changed event:', error);
      }

      logger.info(`Quote submitted successfully: ${quoteId}, status: ${finalStatus}, driver assigned: ${driverAssigned}`);

      return {
        quoteId: updatedQuote.quoteId,
        status: finalStatus,
        pricing,
      };
    } catch (error) {
      logger.error(
        `Error submitting quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to submit quote', 'QUOTE_SUBMISSION_ERROR', 500);
    }
  }
}

