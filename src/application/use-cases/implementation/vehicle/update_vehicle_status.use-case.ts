import { injectable, inject } from 'tsyringe';
import { IUpdateVehicleStatusUseCase } from '../../interface/vehicle/update_vehicle_status_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { UpdateVehicleStatusRequest, UpdateVehicleStatusResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for updating vehicle status
 * Updates the status of an existing vehicle
 */
@injectable()
export class UpdateVehicleStatusUseCase implements IUpdateVehicleStatusUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string, request: UpdateVehicleStatusRequest): Promise<UpdateVehicleStatusResponse> {
    // Find existing vehicle
    const existingVehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!existingVehicle) {
      logger.warn(`Vehicle status update attempt for non-existent ID: ${vehicleId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    // Update status
    await this.vehicleRepository.updateById(vehicleId, { status: request.status });

    // Fetch updated vehicle
    const updatedVehicle = await this.vehicleRepository.findById(vehicleId);
    if (!updatedVehicle) {
      throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    logger.info(`Vehicle status updated: ${updatedVehicle.plateNumber} to ${request.status} (${vehicleId})`);

    return VehicleMapper.toUpdateVehicleStatusResponse(updatedVehicle);
  }
}

