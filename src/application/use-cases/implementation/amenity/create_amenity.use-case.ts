import { injectable, inject } from 'tsyringe';
import { ICreateAmenityUseCase } from '../../interface/amenity/create_amenity_use_case.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { CreateAmenityRequest, CreateAmenityResponse } from '../../../dtos/amenity.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AmenityMapper } from '../../../mapper/amenity.mapper';
import { Amenity } from '../../../../domain/entities/amenity.entity';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for creating amenity
 * Creates a new amenity in the system
 */
@injectable()
export class CreateAmenityUseCase implements ICreateAmenityUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
  ) {}

  async execute(request: CreateAmenityRequest): Promise<CreateAmenityResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.name || typeof request.name !== 'string' || request.name.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check if amenity with same name already exists
    const existingAmenity = await this.amenityRepository.findByName(request.name.trim());
    
    if (existingAmenity) {
      logger.warn(`Attempt to create duplicate amenity: ${request.name}`);
      throw new AppError(ERROR_MESSAGES.AMENITY_ALREADY_EXISTS, ERROR_CODES.INVALID_REQUEST, 409);
    }

    // Generate amenity ID
    const amenityId = randomUUID();
    const now = new Date();

    // Normalize price: if undefined, set to null; if provided, use the value
    const price = request.price !== undefined ? request.price : null;

    // Create amenity entity
    const amenity = new Amenity(
      amenityId,
      request.name.trim(),
      price,
      now,
      now,
    );

    // Save to repository
    await this.amenityRepository.create(amenity);

    logger.info(`Amenity created: ${amenity.name} (${amenityId})`);

    return AmenityMapper.toCreateAmenityResponse(amenity);
  }
}

