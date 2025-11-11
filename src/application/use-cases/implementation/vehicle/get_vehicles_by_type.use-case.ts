import { injectable, inject } from 'tsyringe';
import { IGetVehiclesByTypeUseCase } from '../../interface/vehicle/get_vehicles_by_type_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { GetVehiclesByTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting vehicles by type
 * Retrieves all vehicles of a specific type
 */
@injectable()
export class GetVehiclesByTypeUseCase implements IGetVehiclesByTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(vehicleTypeId: string): Promise<GetVehiclesByTypeResponse> {
    // Validate vehicle type exists
    const vehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Attempt to get vehicles for invalid vehicle type: ${vehicleTypeId}`);
      throw new Error(ERROR_MESSAGES.INVALID_VEHICLE_TYPE);
    }

    // Get vehicles by type
    const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleTypeId);
    
    logger.info(`Fetched ${vehicles.length} vehicles for type: ${vehicleType.name}`);

    return VehicleMapper.toGetVehiclesByTypeResponse(vehicles, vehicleType);
  }
}

