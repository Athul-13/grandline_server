import { injectable, inject } from 'tsyringe';
import { IGetPaidAmenitiesUseCase } from '../../interface/amenity/get_paid_amenities_use_case.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { Amenity } from '../../../../domain/entities/amenity.entity';
import { GetPaidAmenitiesResponse } from '../../../dtos/amenity.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { AmenityMapper } from '../../../mapper/amenity.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting paid amenities
 * Returns only amenities with price > 0 with pagination
 */
@injectable()
export class GetPaidAmenitiesUseCase implements IGetPaidAmenitiesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
  ) {}

  async execute(page: number = 1, limit: number = 20): Promise<GetPaidAmenitiesResponse> {
    // Validate and normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(page) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

    // Fetch paid amenities
    const paidAmenities = await this.amenityRepository.findPaidAmenities();
    
    // Map to response DTOs
    const amenitiesData = paidAmenities.map((amenity: Amenity) => AmenityMapper.toAmenityResponse(amenity));

    // Calculate pagination metadata
    const total = amenitiesData.length;
    const totalPages = Math.ceil(total / normalizedLimit);

    // Apply pagination (slice array)
    const startIndex = (normalizedPage - 1) * normalizedLimit;
    const endIndex = startIndex + normalizedLimit;
    const paginatedData = amenitiesData.slice(startIndex, endIndex);

    logger.info(`Fetched ${paginatedData.length} paid amenities (page ${normalizedPage}, limit ${normalizedLimit}, total ${total})`);

    return {
      data: paginatedData,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    };
  }
}

