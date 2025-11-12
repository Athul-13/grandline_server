import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleStatusUseCase } from '../../interface/vehicle/update_vehicle_status_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { UpdateVehicleStatusRequest, UpdateVehicleStatusResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for updating vehicle status
 * Updates the status of an existing vehicle
 */
@injectable()
export class UpdateVehicleStatusUseCase implements IUpdateVehicleStatusUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(vehicleId: string, request: UpdateVehicleStatusRequest): Promise<UpdateVehicleStatusResponse> {
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
      logger.warn(`Vehicle status update attempt for non-existent ID: ${vehicleId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_NOT_FOUND, ERROR_CODES.VEHICLE_NOT_FOUND, 404);
    }

    // Update status
    await this.vehicleRepository.updateById(vehicleId, { status: request.status });

    // Fetch updated vehicle
    const updatedVehicle = await this.vehicleRepository.findById(vehicleId);
    if (!updatedVehicle) {
      throw new AppError(ERROR_MESSAGES.VEHICLE_NOT_FOUND, ERROR_CODES.VEHICLE_NOT_FOUND, 404);
    }

    // Fetch vehicle type
    const vehicleType = await this.vehicleTypeRepository.findById(updatedVehicle.vehicleTypeId);
    if (!vehicleType) {
      logger.error(`Vehicle type not found for vehicle: ${vehicleId}, vehicleTypeId: ${updatedVehicle.vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    logger.info(`Vehicle status updated: ${updatedVehicle.plateNumber} to ${request.status} (${vehicleId})`);

    return VehicleMapper.toUpdateVehicleStatusResponse(updatedVehicle, vehicleType);
  }
}

