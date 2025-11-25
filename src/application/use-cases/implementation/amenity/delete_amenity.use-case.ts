import { injectable, inject } from 'tsyringe';
import { IDeleteAmenityUseCase } from '../../interface/amenity/delete_amenity_use_case.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for deleting amenity
 * Deletes an amenity if no vehicles are using it
 */
@injectable()
export class DeleteAmenityUseCase implements IDeleteAmenityUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(id: string): Promise<void> {
    // Input validation
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_AMENITY_ID, 400);
    }

    // Check if amenity exists
    const amenity = await this.amenityRepository.findById(id);
    
    if (!amenity) {
      logger.warn(`Amenity delete attempt for non-existent ID: ${id}`);
      throw new AppError(ERROR_MESSAGES.AMENITY_NOT_FOUND, ERROR_CODES.AMENITY_NOT_FOUND, 404);
    }

    // Check if any vehicles are using this amenity
    const vehicles = await this.vehicleRepository.findByAmenityId(id);
    
    if (vehicles.length > 0) {
      logger.warn(`Attempt to delete amenity in use: ${amenity.name} (${id})`);
      throw new AppError(ERROR_MESSAGES.AMENITY_IN_USE, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Delete amenity
    await this.amenityRepository.deleteById(id);

    logger.info(`Amenity deleted: ${amenity.name} (${id})`);
  }
}

