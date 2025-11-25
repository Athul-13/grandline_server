import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleTypeUseCase } from '../../interface/vehicle_type/update_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { UpdateVehicleTypeRequest, VehicleTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { VehicleType } from '../../../../domain/entities/vehicle_type.entity';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for updating vehicle type
 * Updates an existing vehicle type
 */
@injectable()
export class UpdateVehicleTypeUseCase implements IUpdateVehicleTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleTypeId: string, request: UpdateVehicleTypeRequest): Promise<VehicleTypeResponse> {
    // Input validation
    if (!vehicleTypeId || typeof vehicleTypeId !== 'string' || vehicleTypeId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_TYPE_ID, 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Find existing vehicle type
    const existingVehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!existingVehicleType) {
      logger.warn(`Vehicle type update attempt for non-existent ID: ${vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    // Check if name is being updated and if new name already exists
    if (request.name && request.name.trim() !== existingVehicleType.name) {
      const vehicleTypeWithSameName = await this.vehicleTypeRepository.findByName(request.name.trim());
      if (vehicleTypeWithSameName) {
        logger.warn(`Attempt to update vehicle type with duplicate name: ${request.name}`);
        throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_ALREADY_EXISTS, ERROR_CODES.INVALID_REQUEST, 409);
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
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    logger.info(`Vehicle type updated: ${updatedVehicleType.name} (${vehicleTypeId})`);

    // Get vehicles count for this type
    const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleTypeId);
    const vehicleCount = vehicles.length;

    return VehicleMapper.toVehicleTypeResponse(updatedVehicleType, vehicleCount);
  }
}

