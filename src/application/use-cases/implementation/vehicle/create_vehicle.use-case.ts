import { injectable, inject } from 'tsyringe';
import { ICreateVehicleUseCase } from '../../interface/vehicle/create_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IAmenityRepository } from '../../../../domain/repositories/amenity_repository.interface';
import { ICloudinaryService } from '../../../../domain/services/cloudinary_service.interface';
import { CreateVehicleRequest, CreateVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { VehicleStatus } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for creating vehicle
 * Creates a new vehicle in the system
 */
@injectable()
export class CreateVehicleUseCase implements ICreateVehicleUseCase {
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

  async execute(request: CreateVehicleRequest): Promise<CreateVehicleResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.vehicleTypeId || typeof request.vehicleTypeId !== 'string' || request.vehicleTypeId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_TYPE_ID, 400);
    }

    if (!request.plateNumber || typeof request.plateNumber !== 'string' || request.plateNumber.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Validate vehicle type exists
    const vehicleType = await this.vehicleTypeRepository.findById(request.vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Attempt to create vehicle with invalid vehicle type: ${request.vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.INVALID_VEHICLE_TYPE, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    // Check if plate number already exists
    const existingVehicle = await this.vehicleRepository.findByPlateNumber(request.plateNumber.trim());
    
    if (existingVehicle) {
      logger.warn(`Attempt to create vehicle with duplicate plate number: ${request.plateNumber}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_PLATE_NUMBER_EXISTS, ERROR_CODES.INVALID_REQUEST, 409);
    }

    // Validate amenities if provided
    const amenityIds = request.amenityIds && request.amenityIds.length > 0 ? request.amenityIds : [];
    if (amenityIds.length > 0) {
      const amenities = await this.amenityRepository.findByIds(amenityIds);
      if (amenities.length !== amenityIds.length) {
        logger.warn(`Attempt to create vehicle with invalid amenity IDs`);
        throw new AppError(ERROR_MESSAGES.INVALID_AMENITY, ERROR_CODES.AMENITY_NOT_FOUND, 400);
      }
    }

    // Generate vehicle ID
    const vehicleId = randomUUID();
    const now = new Date();
    const imageUrls = request.imageUrls && request.imageUrls.length > 0 ? request.imageUrls : undefined;

    try {
      // Create vehicle entity
      const vehicle = new Vehicle(
        vehicleId,
        request.vehicleTypeId,
        request.capacity,
        request.baseFare,
        request.maintenance,
        request.plateNumber.trim().toUpperCase(),
        request.vehicleModel.trim(),
        request.year,
        request.fuelConsumption,
        request.status || VehicleStatus.AVAILABLE,
        now,
        now,
        imageUrls,
        amenityIds
      );

      // Save to repository
      await this.vehicleRepository.create(vehicle);

      logger.info(`Vehicle created: ${vehicle.plateNumber} (${vehicleId})`);

      return VehicleMapper.toCreateVehicleResponse(vehicle, vehicleType);
    } catch (error) {
      // If creation fails and images were provided, rollback: delete uploaded images
      if (imageUrls && imageUrls.length > 0) {
        try {
          await this.cloudinaryService.deleteFiles(imageUrls);
          logger.info(`Rollback: Deleted ${imageUrls.length} uploaded images due to vehicle creation failure`);
        } catch (rollbackError) {
          // Log rollback error but don't mask the original error
          logger.error(`Failed to rollback images during vehicle creation failure: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`);
        }
      }
      
      // Re-throw the original error
      throw error;
    }
  }
}

