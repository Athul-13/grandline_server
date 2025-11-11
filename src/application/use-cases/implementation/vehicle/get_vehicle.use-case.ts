import { injectable, inject } from 'tsyringe';
import { IGetVehicleUseCase } from '../../interface/vehicle/get_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { GetVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting vehicle by ID
 * Retrieves a specific vehicle
 */
@injectable()
export class GetVehicleUseCase implements IGetVehicleUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(vehicleId: string): Promise<GetVehicleResponse> {
    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      logger.warn(`Vehicle fetch attempt for non-existent ID: ${vehicleId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_NOT_FOUND);
    }

    // Fetch vehicle type
    const vehicleType = await this.vehicleTypeRepository.findById(vehicle.vehicleTypeId);
    if (!vehicleType) {
      logger.error(`Vehicle type not found for vehicle: ${vehicleId}, vehicleTypeId: ${vehicle.vehicleTypeId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND);
    }

    logger.info(`Vehicle fetched: ${vehicle.plateNumber} (${vehicleId})`);

    return VehicleMapper.toGetVehicleResponse(vehicle, vehicleType);
  }
}

