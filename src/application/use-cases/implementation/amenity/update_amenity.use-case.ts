import { injectable, inject } from 'tsyringe';
import { IUpdateAmenityUseCase } from '../../interface/amenity/update_amenity_use_case.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { UpdateAmenityRequest, UpdateAmenityResponse } from '../../../dtos/amenity.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AmenityMapper } from '../../../mapper/amenity.mapper';
import { Amenity } from '../../../../domain/entities/amenity.entity';
import { logger } from '../../../../shared/logger';

/**
 * Use case for updating amenity
 * Updates an existing amenity
 */
@injectable()
export class UpdateAmenityUseCase implements IUpdateAmenityUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
  ) {}

  async execute(id: string, request: UpdateAmenityRequest): Promise<UpdateAmenityResponse> {
    // Find existing amenity
    const existingAmenity = await this.amenityRepository.findById(id);
    
    if (!existingAmenity) {
      logger.warn(`Amenity update attempt for non-existent ID: ${id}`);
      throw new Error(ERROR_MESSAGES.AMENITY_NOT_FOUND);
    }

    // Check if name is being updated and if new name already exists
    if (request.name && request.name.trim() !== existingAmenity.name) {
      const amenityWithSameName = await this.amenityRepository.findByName(request.name.trim());
      if (amenityWithSameName) {
        logger.warn(`Attempt to update amenity with duplicate name: ${request.name}`);
        throw new Error(ERROR_MESSAGES.AMENITY_ALREADY_EXISTS);
      }
    }

    // Prepare update data
    const updateData: Partial<Amenity> = {};
    if (request.name !== undefined) {
      updateData.name = request.name.trim();
    }
    if (request.price !== undefined) {
      updateData.price = request.price;
    }

    // Update amenity
    await this.amenityRepository.updateById(id, updateData);

    // Fetch updated amenity
    const updatedAmenity = await this.amenityRepository.findById(id);
    if (!updatedAmenity) {
      throw new Error(ERROR_MESSAGES.AMENITY_NOT_FOUND);
    }

    logger.info(`Amenity updated: ${updatedAmenity.name} (${id})`);

    return AmenityMapper.toUpdateAmenityResponse(updatedAmenity);
  }
}

