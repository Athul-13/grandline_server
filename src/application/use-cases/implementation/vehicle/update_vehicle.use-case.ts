import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleUseCase } from '../../interface/vehicle/update_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { UpdateVehicleRequest, UpdateVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

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
    @inject(REPOSITORY_TOKENS.IAmenityRepository)
    private readonly amenityRepository: IAmenityRepository,
    @inject(SERVICE_TOKENS.ICloudinaryService)
    private readonly cloudinaryService: ICloudinaryService,
  ) {}

  async execute(vehicleId: string, request: UpdateVehicleRequest): Promise<UpdateVehicleResponse> {
    // Input validation
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Find existing vehicle
    const existingVehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!existingVehicle) {
      logger.warn(`Vehicle update attempt for non-existent ID: ${vehicleId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_NOT_FOUND, ERROR_CODES.VEHICLE_NOT_FOUND, 404);
    }

    // Validate vehicle type if being updated
    if (request.vehicleTypeId && request.vehicleTypeId !== existingVehicle.vehicleTypeId) {
      const vehicleType = await this.vehicleTypeRepository.findById(request.vehicleTypeId);
      if (!vehicleType) {
        logger.warn(`Attempt to update vehicle with invalid vehicle type: ${request.vehicleTypeId}`);
        throw new AppError(ERROR_MESSAGES.INVALID_VEHICLE_TYPE, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
      }
    }

    // Check if plate number is being updated and if new plate number already exists
    if (request.plateNumber && request.plateNumber.trim().toUpperCase() !== existingVehicle.plateNumber) {
      const vehicleWithSamePlate = await this.vehicleRepository.findByPlateNumber(request.plateNumber.trim());
      if (vehicleWithSamePlate) {
        logger.warn(`Attempt to update vehicle with duplicate plate number: ${request.plateNumber}`);
        throw new AppError(ERROR_MESSAGES.VEHICLE_PLATE_NUMBER_EXISTS, ERROR_CODES.INVALID_REQUEST, 409);
      }
    }

    // Track existing images for rollback if update fails
    const oldImageUrls = existingVehicle.imageUrls || [];
    
    // Identify newly uploaded images for rollback tracking
    const newImages = request.imageUrls !== undefined
      ? request.imageUrls.filter(url => !oldImageUrls.includes(url))
      : [];
    
    // Extract images marked for deletion
    const getRemovedImageUrls = (removedUrls: unknown): string[] => {
      if (Array.isArray(removedUrls) && removedUrls.length > 0) {
        return removedUrls.filter((url): url is string => typeof url === 'string');
      }
      return [];
    };
    
    const imagesToDelete = getRemovedImageUrls(request.removedImageUrls);

    // Validate amenities if being updated
    if (request.amenityIds !== undefined) {
      const amenityIds = request.amenityIds.length > 0 ? request.amenityIds : [];
      if (amenityIds.length > 0) {
        const amenities = await this.amenityRepository.findByIds(amenityIds);
        if (amenities.length !== amenityIds.length) {
          logger.warn(`Attempt to update vehicle with invalid amenity IDs`);
          throw new AppError(ERROR_MESSAGES.INVALID_AMENITY, ERROR_CODES.AMENITY_NOT_FOUND, 400);
        }
      }
    }

    // Prepare update data
    // Use Record type to allow assignment since Vehicle properties are readonly
    const updateData: Record<string, unknown> = {};
    if (request.vehicleTypeId !== undefined) updateData.vehicleTypeId = request.vehicleTypeId;
    if (request.capacity !== undefined) updateData.capacity = request.capacity;
    if (request.baseFare !== undefined) updateData.baseFare = request.baseFare;
    if (request.maintenance !== undefined) updateData.maintenance = request.maintenance;
    if (request.plateNumber !== undefined) updateData.plateNumber = request.plateNumber.trim().toUpperCase();
    if (request.vehicleModel !== undefined) updateData.vehicleModel = request.vehicleModel.trim();
    if (request.year !== undefined) updateData.year = request.year;
    if (request.fuelConsumption !== undefined) updateData.fuelConsumption = request.fuelConsumption;
    if (request.imageUrls !== undefined) {
      // imageUrls represents the final desired state (can be empty array)
      // Empty array is valid - it means vehicle should have no images
      updateData.imageUrls = request.imageUrls;
    }
    if (request.amenityIds !== undefined) {
      // If empty array, set to empty array (not undefined) - MongoDB will handle it correctly
      // Empty array means user wants to remove all amenities
      updateData.amenityIds = request.amenityIds;
    }
    if (request.status !== undefined) {
      updateData.status = request.status;
    }

    try {
      // Update vehicle
      // Cast to Partial<Vehicle> for repository method (readonly properties are handled at entity level)
      await this.vehicleRepository.updateById(vehicleId, updateData as Partial<Vehicle>);

      // Fetch updated vehicle
      const updatedVehicle = await this.vehicleRepository.findById(vehicleId);
      if (!updatedVehicle) {
        throw new AppError(ERROR_MESSAGES.VEHICLE_NOT_FOUND, ERROR_CODES.VEHICLE_NOT_FOUND, 404);
      }

      // Fetch vehicle type (use updated type if changed, otherwise existing)
      const finalVehicleTypeId = request.vehicleTypeId || existingVehicle.vehicleTypeId;
      const finalVehicleType = await this.vehicleTypeRepository.findById(finalVehicleTypeId);
      if (!finalVehicleType) {
        logger.error(`Vehicle type not found for vehicle: ${vehicleId}, vehicleTypeId: ${finalVehicleTypeId}`);
        throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
      }

      // Delete images that were removed from the vehicle during update
      if (imagesToDelete.length > 0) {
        try {
          await this.cloudinaryService.deleteFiles(imagesToDelete);
          logger.info(`Deleted ${imagesToDelete.length} images from Cloudinary for vehicle: ${vehicleId}`);
        } catch (error) {
          // Deletion is idempotent - safe to retry if images are already deleted
          logger.warn(`Image deletion warning for vehicle ${vehicleId}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      logger.info(`Vehicle updated: ${updatedVehicle.plateNumber} (${vehicleId})`);

      return VehicleMapper.toUpdateVehicleResponse(updatedVehicle, finalVehicleType);
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

