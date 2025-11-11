import { injectable, inject } from 'tsyringe';
import { IDeleteVehicleTypeUseCase } from '../../interface/vehicle_type/delete_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

/**
 * Use case for deleting vehicle type
 * Deletes a vehicle type if no vehicles are using it
 */
@injectable()
export class DeleteVehicleTypeUseCase implements IDeleteVehicleTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleTypeId: string): Promise<void> {
    // Check if vehicle type exists
    const vehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Vehicle type delete attempt for non-existent ID: ${vehicleTypeId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND);
    }

    // Check if any vehicles are using this vehicle type
    const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleTypeId);
    
    if (vehicles.length > 0) {
      logger.warn(`Attempt to delete vehicle type in use: ${vehicleType.name} (${vehicleTypeId})`);
      throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_IN_USE);
    }

    // Delete vehicle type
    await this.vehicleTypeRepository.deleteById(vehicleTypeId);

    logger.info(`Vehicle type deleted: ${vehicleType.name} (${vehicleTypeId})`);
  }
}

