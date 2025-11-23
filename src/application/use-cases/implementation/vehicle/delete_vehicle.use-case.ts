import { injectable, inject } from 'tsyringe';
import { IDeleteVehicleUseCase } from '../../interface/vehicle/delete_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for deleting vehicle
 * Deletes a vehicle if it's not in use
 */
@injectable()
export class DeleteVehicleUseCase implements IDeleteVehicleUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(vehicleId: string): Promise<void> {
    // Input validation
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_ID, 400);
    }

    // Find existing vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      logger.warn(`Vehicle delete attempt for non-existent ID: ${vehicleId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_NOT_FOUND, ERROR_CODES.VEHICLE_NOT_FOUND, 404);
    }

    // Check if vehicle is in service
    if (vehicle.status === VehicleStatus.IN_SERVICE) {
      logger.warn(`Attempt to delete vehicle in service: ${vehicle.plateNumber} (${vehicleId})`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_IN_USE, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Delete images from Cloudinary before deleting vehicle
    if (vehicle.imageUrls && vehicle.imageUrls.length > 0) {
      try {
        await this.cloudinaryService.deleteFiles(vehicle.imageUrls);
        logger.info(`Deleted ${vehicle.imageUrls.length} images from Cloudinary for vehicle: ${vehicleId}`);
      } catch (error) {
        // Log error but don't fail the deletion - continue with vehicle deletion
        logger.error(`Failed to delete images from Cloudinary for vehicle ${vehicleId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Delete vehicle
    await this.vehicleRepository.deleteById(vehicleId);

    logger.info(`Vehicle deleted: ${vehicle.plateNumber} (${vehicleId})`);
  }
}

