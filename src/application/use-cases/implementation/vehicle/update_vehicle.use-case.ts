import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleUseCase } from '../../interface/vehicle/update_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { UpdateVehicleRequest, UpdateVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
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

    // Update vehicle
    await this.vehicleRepository.updateById(vehicleId, updateData);

    // Fetch updated vehicle
    const updatedVehicle = await this.vehicleRepository.findById(vehicleId);
    if (!updatedVehicle) {
      throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    logger.info(`Vehicle updated: ${updatedVehicle.plateNumber} (${vehicleId})`);

    return VehicleMapper.toUpdateVehicleResponse(updatedVehicle);
  }
}

