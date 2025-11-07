import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleTypeUseCase } from '../../interface/vehicle_type/update_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { UpdateVehicleTypeRequest, VehicleTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { VehicleType } from '../../../../domain/entities/vehicle_type.entity';
import { logger } from '../../../../shared/logger';

/**
 * Use case for updating vehicle type
 * Updates an existing vehicle type
 */
@injectable()
export class UpdateVehicleTypeUseCase implements IUpdateVehicleTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(vehicleTypeId: string, request: UpdateVehicleTypeRequest): Promise<VehicleTypeResponse> {
    // Find existing vehicle type
    const existingVehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!existingVehicleType) {
      logger.warn(`Vehicle type update attempt for non-existent ID: ${vehicleTypeId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND);
    }

    // Check if name is being updated and if new name already exists
    if (request.name && request.name.trim() !== existingVehicleType.name) {
      const vehicleTypeWithSameName = await this.vehicleTypeRepository.findByName(request.name.trim());
      if (vehicleTypeWithSameName) {
        logger.warn(`Attempt to update vehicle type with duplicate name: ${request.name}`);
        throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_ALREADY_EXISTS);
      }
    }

    // Prepare update data
    const updateData: Partial<VehicleType> = {};
    if (request.name !== undefined) {
      updateData.name = request.name.trim();
    }
    if (request.description !== undefined) {
      updateData.description = request.description.trim();
    }

    // Update vehicle type
    await this.vehicleTypeRepository.updateById(vehicleTypeId, updateData);

    // Fetch updated vehicle type
    const updatedVehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    if (!updatedVehicleType) {
      throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND);
    }

    logger.info(`Vehicle type updated: ${updatedVehicleType.name} (${vehicleTypeId})`);

    return VehicleMapper.toVehicleTypeResponse(updatedVehicleType);
  }
}

