import { injectable, inject } from 'tsyringe';
import { IDeleteVehicleTypeUseCase } from '../../interface/vehicle_type/delete_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

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
    // Input validation
    if (!vehicleTypeId || typeof vehicleTypeId !== 'string' || vehicleTypeId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_TYPE_ID, 400);
    }

    // Check if vehicle type exists
    const vehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Vehicle type delete attempt for non-existent ID: ${vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    // Check if any vehicles are using this vehicle type
    const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleTypeId);
    
    if (vehicles.length > 0) {
      logger.warn(`Attempt to delete vehicle type in use: ${vehicleType.name} (${vehicleTypeId})`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_IN_USE, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Delete vehicle type
    await this.vehicleTypeRepository.deleteById(vehicleTypeId);

    logger.info(`Vehicle type deleted: ${vehicleType.name} (${vehicleTypeId})`);
  }
}

