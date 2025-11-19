import { inject, injectable } from 'tsyringe';
import { ICalculateQuotePricingUseCase } from '../../interface/quote/calculate_quote_pricing_use_case.interface';
import { PricingBreakdownResponse } from '../../../dtos/quote.dto';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { IPricingConfigRepository } from '../../../../domain/repositories/pricing_config_repository.interface';
import { IPricingCalculationService } from '../../../../domain/services/pricing_calculation_service.interface';
import { Amenity } from '../../../../domain/entities/amenity.entity';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, TripType } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for calculating quote pricing
 * Calculates the total price for a quote based on vehicles, itinerary, and amenities
 */
@injectable()
export class CalculateQuotePricingUseCase implements ICalculateQuotePricingUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
    @inject(REPOSITORY_TOKENS.IPricingConfigRepository)
    private readonly pricingConfigRepository: IPricingConfigRepository,
    @inject(SERVICE_TOKENS.IPricingCalculationService)
    private readonly pricingCalculationService: IPricingCalculationService
  ) {}

  async execute(quoteId: string, userId: string): Promise<PricingBreakdownResponse> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
      }

      logger.info(`Calculating pricing for quote: ${quoteId} by user: ${userId}`);

      // Get quote and verify ownership
      const quote = await this.quoteRepository.findById(quoteId);

      if (!quote) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      if (quote.userId !== userId) {
        throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
      }

      // Validate required data
      if (!quote.selectedVehicles || quote.selectedVehicles.length === 0) {
        throw new AppError(ERROR_MESSAGES.VEHICLES_REQUIRED, 'VEHICLES_REQUIRED', 400);
      }

      if (!quote.routeData) {
        throw new AppError(ERROR_MESSAGES.ROUTE_CALCULATION_FAILED, ERROR_CODES.ROUTE_CALCULATION_ERROR, 400);
      }

      // Get itinerary
      const outboundItinerary = await this.itineraryRepository.findByQuoteIdAndTripType(quoteId, 'outbound');
      const returnItinerary = quote.tripType === TripType.TWO_WAY
        ? await this.itineraryRepository.findByQuoteIdAndTripType(quoteId, 'return')
        : undefined;

      if (outboundItinerary.length === 0) {
        throw new AppError(ERROR_MESSAGES.ITINERARY_REQUIRED, 'ITINERARY_REQUIRED', 400);
      }

      // Get vehicles
      const vehicleIds = quote.selectedVehicles.map((sv) => sv.vehicleId);
      const vehicles = await Promise.all(
        vehicleIds.map((id) => this.vehicleRepository.findById(id))
      );

      // Type-safe vehicle mapping
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

      // Calculate pricing
      const pricingBreakdown = this.pricingCalculationService.calculatePricing({
        selectedVehicles: vehiclesWithQuantity,
        selectedAmenities,
        itinerary: {
          outbound: outboundItinerary,
          return: returnItinerary,
        },
        pricingConfig,
        tripType: quote.tripType,
        routeData: quote.routeData, // Pass route data for accurate distance/duration calculation
      });

      // Map to response DTO
      const response: PricingBreakdownResponse = {
        fuelPriceAtTime: pricingBreakdown.fuelPriceAtTime,
        averageDriverRateAtTime: pricingBreakdown.averageDriverRateAtTime,
        taxPercentageAtTime: pricingBreakdown.taxPercentageAtTime,
        baseFare: pricingBreakdown.baseFare ?? 0,
        distanceFare: pricingBreakdown.distanceFare ?? 0,
        driverCharge: pricingBreakdown.driverCharge ?? 0,
        fuelMaintenance: pricingBreakdown.fuelMaintenance ?? 0,
        nightCharge: pricingBreakdown.nightCharge ?? 0,
        amenitiesTotal: pricingBreakdown.amenitiesTotal ?? 0,
        subtotal: pricingBreakdown.subtotal ?? 0,
        tax: pricingBreakdown.tax ?? 0,
        total: pricingBreakdown.total ?? 0,
      };

      logger.info(`Pricing calculated successfully for quote: ${quoteId}, total: ${response.total}`);
      return response;
    } catch (error) {
      logger.error(
        `Error calculating pricing for quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to calculate pricing', 'PRICING_CALCULATION_ERROR', 500);
    }
  }
}

