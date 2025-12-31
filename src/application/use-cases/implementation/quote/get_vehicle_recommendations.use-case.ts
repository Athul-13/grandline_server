import { inject, injectable } from 'tsyringe';
import { IGetVehicleRecommendationsUseCase } from '../../interface/quote/get_vehicle_recommendations_use_case.interface';
import { GetRecommendationsRequest, VehicleRecommendationResponse } from '../../../dtos/quote.dto';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IVehicleRecommendationService } from '../../../../domain/services/vehicle_recommendation_service.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { VehicleStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting vehicle recommendations
 * Provides vehicle recommendations based on passenger count and trip dates
 * Filters out vehicles that are already booked or reserved during the requested dates
 */
@injectable()
export class GetVehicleRecommendationsUseCase implements IGetVehicleRecommendationsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(SERVICE_TOKENS.IVehicleRecommendationService)
    private readonly vehicleRecommendationService: IVehicleRecommendationService,
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository
  ) {}

  async execute(request: GetRecommendationsRequest): Promise<VehicleRecommendationResponse> {
    try {
      logger.info(
        `Getting vehicle recommendations for ${request.passengerCount} passengers, trip type: ${request.tripType}, dates: ${request.tripStartDate} to ${request.tripEndDate}`
      );

      // Parse dates
      const startDate = new Date(request.tripStartDate);
      const endDate = new Date(request.tripEndDate);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new AppError('Invalid date format', 'INVALID_DATE_FORMAT', 400);
      }

      if (startDate >= endDate) {
        throw new AppError('Start date must be before end date', 'INVALID_DATE_RANGE', 400);
      }

      // 1. Get all vehicles with AVAILABLE status
      const allAvailableVehicles = await this.vehicleRepository.findByStatus(VehicleStatus.AVAILABLE);

      // 2. Find vehicles already booked during these dates (PAID, ACCEPTED, QUOTED, etc.)
      const bookedVehicleIds = await this.quoteRepository.findBookedVehicleIdsInDateRange(
        startDate,
        endDate
      );

      // 3. Find vehicles temporarily reserved in recent DRAFT quotes
      const reservedVehicleIds = await this.quoteRepository.findReservedVehicleIdsInDateRange(
        startDate,
        endDate
      );

      // 4. Combine booked and reserved vehicles
      const unavailableVehicleIds = new Set([
        ...bookedVehicleIds,
        ...reservedVehicleIds,
      ]);

      // 5. Filter out unavailable vehicles
      const trulyAvailableVehicles = allAvailableVehicles.filter(
        (vehicle) => !unavailableVehicleIds.has(vehicle.vehicleId)
      );

      logger.info(
        `Found ${allAvailableVehicles.length} available vehicles, ${bookedVehicleIds.size} booked, ${reservedVehicleIds.size} reserved, ${trulyAvailableVehicles.length} truly available`
      );

      // 6. Get recommendations from truly available vehicles
      const recommendations = this.vehicleRecommendationService.getRecommendations(
        request.passengerCount,
        trulyAvailableVehicles
      );

      // 7. Filter duplicates from available vehicles for response (case-insensitive by name)
      const uniqueAvailableVehicles = this.filterDuplicateVehiclesByName(trulyAvailableVehicles);

      // 8. Get all amenities for mapping
      const allAmenities = await this.amenityRepository.findAll();
      const amenityMap = new Map(allAmenities.map((a) => [a.amenityId, a]));

      // 9. Map recommendations to response format
      const recommendationOptions = recommendations.map((rec) => ({
        optionId: rec.optionId,
        vehicles: rec.vehicles.map((v) => ({
          vehicleId: v.vehicle.vehicleId,
          vehicleTypeId: v.vehicle.vehicleTypeId,
          name: v.vehicle.vehicleModel,
          capacity: v.vehicle.capacity,
          quantity: v.quantity,
          imageUrls: v.vehicle.imageUrls,
        })),
        totalCapacity: rec.totalCapacity,
        estimatedPrice: rec.estimatedPrice,
        isExactMatch: rec.isExactMatch,
      }));

      // Map available vehicles to response format
      const availableVehiclesResponse = uniqueAvailableVehicles.map((vehicle) => ({
        vehicleId: vehicle.vehicleId,
        vehicleTypeId: vehicle.vehicleTypeId,
        name: vehicle.vehicleModel,
        capacity: vehicle.capacity,
        baseFare: vehicle.baseFare,
        isAvailable: vehicle.isAvailable(),
        availableQuantity: 1, // For now, assume 1 per vehicle (can be enhanced with quantity checking)
        imageUrls: vehicle.imageUrls,
        includedAmenities: vehicle.amenityIds
          .map((id) => {
            const amenity = amenityMap.get(id);
            return amenity ? { amenityId: amenity.amenityId, name: amenity.name } : null;
          })
          .filter((a): a is { amenityId: string; name: string } => a !== null),
      }));

      logger.info(`Found ${recommendationOptions.length} recommendations`);
      return {
        recommendations: recommendationOptions,
        availableVehicles: availableVehiclesResponse,
      };
    } catch (error) {
      logger.error(
        `Error getting vehicle recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  /**
   * Filters out duplicate vehicles by name (case-insensitive)
   * When duplicates are found, keeps the first occurrence
   */
  private filterDuplicateVehiclesByName(vehicles: Vehicle[]): Vehicle[] {
    const seen = new Map<string, Vehicle>();

    for (const vehicle of vehicles) {
      const normalizedName = vehicle.vehicleModel.trim().toLowerCase();
      
      // If we haven't seen this vehicle name before, add it
      if (!seen.has(normalizedName)) {
        seen.set(normalizedName, vehicle);
      }
      // If duplicate found, keep the first one (already in map)
    }

    return Array.from(seen.values());
  }
}

