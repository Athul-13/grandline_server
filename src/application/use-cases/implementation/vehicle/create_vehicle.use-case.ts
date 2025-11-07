import { injectable, inject } from 'tsyringe';
import { ICreateVehicleUseCase } from '../../interface/vehicle/create_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { CreateVehicleRequest, CreateVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { Vehicle } from '../../../../domain/entities/vehicle.entity';
import { VehicleStatus } from '../../../../shared/constants';
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
  ) {}

  async execute(request: CreateVehicleRequest): Promise<CreateVehicleResponse> {
    // Validate vehicle type exists
    const vehicleType = await this.vehicleTypeRepository.findById(request.vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Attempt to create vehicle with invalid vehicle type: ${request.vehicleTypeId}`);
      throw new Error(ERROR_MESSAGES.INVALID_VEHICLE_TYPE);
    }

    // Check if plate number already exists
    const existingVehicle = await this.vehicleRepository.findByPlateNumber(request.plateNumber.trim());
    
    if (existingVehicle) {
      logger.warn(`Attempt to create vehicle with duplicate plate number: ${request.plateNumber}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_PLATE_NUMBER_EXISTS);
    }

    // Generate vehicle ID
    const vehicleId = randomUUID();
    const now = new Date();

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
      now
    );

    // Save to repository
    await this.vehicleRepository.create(vehicle);

    logger.info(`Vehicle created: ${vehicle.plateNumber} (${vehicleId})`);

    return VehicleMapper.toCreateVehicleResponse(vehicle);
  }
}

