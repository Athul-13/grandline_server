import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleUseCase } from '../../interface/vehicle/update_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { UpdateVehicleRequest, UpdateVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { logger } from '../../../../shared/logger';

/**
 * Use case for updating vehicle
 * Updates an existing vehicle
 */
@injectable()
export class UpdateVehicleUseCase implements IUpdateVehicleUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(vehicleId: string, request: UpdateVehicleRequest): Promise<UpdateVehicleResponse> {
    // Find existing vehicle
    const existingVehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!existingVehicle) {
      logger.warn(`Vehicle update attempt for non-existent ID: ${vehicleId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    // Validate vehicle type if being updated
    if (request.vehicleTypeId && request.vehicleTypeId !== existingVehicle.vehicleTypeId) {
      const vehicleType = await this.vehicleTypeRepository.findById(request.vehicleTypeId);
      if (!vehicleType) {
        logger.warn(`Attempt to update vehicle with invalid vehicle type: ${request.vehicleTypeId}`);
        throw new Error(ERROR_MESSAGES.INVALID_VEHICLE_TYPE);
      }
    }

    // Check if plate number is being updated and if new plate number already exists
    if (request.plateNumber && request.plateNumber.trim().toUpperCase() !== existingVehicle.plateNumber) {
      const vehicleWithSamePlate = await this.vehicleRepository.findByPlateNumber(request.plateNumber.trim());
      if (vehicleWithSamePlate) {
        logger.warn(`Attempt to update vehicle with duplicate plate number: ${request.plateNumber}`);
        throw new Error(ERROR_MESSAGES.VEHICLE_PLATE_NUMBER_EXISTS);
      }
    }

    // Store old image URLs for comparison and cleanup
    const oldImageUrls = existingVehicle.imageUrls || [];
    // Only compare if imageUrls is being updated
    const newImageUrls = request.imageUrls !== undefined ? request.imageUrls : oldImageUrls;
    
    // Identify images to delete (old images not in new list) - only if imageUrls is being updated
    const imagesToDelete = request.imageUrls !== undefined
      ? oldImageUrls.filter(url => !newImageUrls.includes(url))
      : [];
    
    // Identify new images (for rollback if update fails) - only if imageUrls is being updated
    const newImages = request.imageUrls !== undefined
      ? newImageUrls.filter(url => !oldImageUrls.includes(url))
      : [];

    // Prepare update data
    const updateData: Partial<Vehicle> = {};
    if (request.vehicleTypeId !== undefined) updateData.vehicleTypeId = request.vehicleTypeId;
    if (request.capacity !== undefined) updateData.capacity = request.capacity;
    if (request.baseFare !== undefined) updateData.baseFare = request.baseFare;
    if (request.maintenance !== undefined) updateData.maintenance = request.maintenance;
    if (request.plateNumber !== undefined) updateData.plateNumber = request.plateNumber.trim().toUpperCase();
    if (request.vehicleModel !== undefined) updateData.vehicleModel = request.vehicleModel.trim();
    if (request.year !== undefined) updateData.year = request.year;
    if (request.fuelConsumption !== undefined) updateData.fuelConsumption = request.fuelConsumption;
    if (request.imageUrls !== undefined) {
      // If empty array, set to empty array (not undefined) - MongoDB will handle it correctly
      // Empty array means user wants to remove all images
      updateData.imageUrls = request.imageUrls;
    }

    try {
      // Update vehicle
      await this.vehicleRepository.updateById(vehicleId, updateData);

      // Fetch updated vehicle
      const updatedVehicle = await this.vehicleRepository.findById(vehicleId);
      if (!updatedVehicle) {
        throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
      }

      // Delete old images that are no longer in use (after successful update)
      if (imagesToDelete.length > 0) {
        try {
          await this.cloudinaryService.deleteFiles(imagesToDelete);
          logger.info(`Deleted ${imagesToDelete.length} old images from Cloudinary for vehicle: ${vehicleId}`);
        } catch (error) {
          // Log error but don't fail the update - images are orphaned but update succeeded
          logger.error(`Failed to delete old images from Cloudinary for vehicle ${vehicleId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      logger.info(`Vehicle updated: ${updatedVehicle.plateNumber} (${vehicleId})`);

      return VehicleMapper.toUpdateVehicleResponse(updatedVehicle);
    } catch (error) {
      // If update fails, rollback: delete newly uploaded images
      if (newImages.length > 0) {
        try {
          await this.cloudinaryService.deleteFiles(newImages);
          logger.info(`Rollback: Deleted ${newImages.length} newly uploaded images due to update failure for vehicle: ${vehicleId}`);
        } catch (rollbackError) {
          // Log rollback error but don't mask the original error
          logger.error(`Failed to rollback images during update failure for vehicle ${vehicleId}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }
      
      // Re-throw the original error
      throw error;
    }
  }
}

