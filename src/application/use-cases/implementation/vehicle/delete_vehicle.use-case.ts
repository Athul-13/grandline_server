import { injectable, inject } from 'tsyringe';
import { IDeleteVehicleUseCase } from '../../interface/vehicle/delete_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleStatus } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

/**
 * Use case for deleting vehicle
 * Deletes a vehicle if it's not in use
 */
@injectable()
export class DeleteVehicleUseCase implements IDeleteVehicleUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleId: string): Promise<void> {
    // Find existing vehicle
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      logger.warn(`Vehicle delete attempt for non-existent ID: ${vehicleId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    // Check if vehicle is in service
    if (vehicle.status === VehicleStatus.IN_SERVICE) {
      logger.warn(`Attempt to delete vehicle in service: ${vehicle.plateNumber} (${vehicleId})`);
      throw new Error(ERROR_MESSAGES.VEHICLE_IN_USE);
    }

    // Delete vehicle
    await this.vehicleRepository.deleteById(vehicleId);

    logger.info(`Vehicle deleted: ${vehicle.plateNumber} (${vehicleId})`);
  }
}

