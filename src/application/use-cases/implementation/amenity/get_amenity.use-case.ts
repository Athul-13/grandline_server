import { injectable, inject } from 'tsyringe';
import { IGetAmenityUseCase } from '../../interface/amenity/get_amenity_use_case.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { GetAmenityResponse } from '../../../dtos/amenity.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AmenityMapper } from '../../../mapper/amenity.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting amenity by ID
 */
@injectable()
export class GetAmenityUseCase implements IGetAmenityUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
  ) {}

  async execute(id: string): Promise<GetAmenityResponse> {
    // Input validation
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_AMENITY_ID, 400);
    }

    const amenity = await this.amenityRepository.findById(id);
    
    if (!amenity) {
      logger.warn(`Amenity not found: ${id}`);
      throw new AppError(ERROR_MESSAGES.AMENITY_NOT_FOUND, ERROR_CODES.AMENITY_NOT_FOUND, 404);
    }

    return AmenityMapper.toGetAmenityResponse(amenity);
  }
}

