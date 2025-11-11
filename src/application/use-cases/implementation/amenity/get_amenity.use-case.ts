import { injectable, inject } from 'tsyringe';
import { IGetAmenityUseCase } from '../../interface/amenity/get_amenity_use_case.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { GetAmenityResponse } from '../../../dtos/amenity.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AmenityMapper } from '../../../mapper/amenity.mapper';
import { logger } from '../../../../shared/logger';

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
    const amenity = await this.amenityRepository.findById(id);
    
    if (!amenity) {
      logger.warn(`Amenity not found: ${id}`);
      throw new Error(ERROR_MESSAGES.AMENITY_NOT_FOUND);
    }

    return AmenityMapper.toGetAmenityResponse(amenity);
  }
}

