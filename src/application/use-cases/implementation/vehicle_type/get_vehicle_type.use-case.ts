import { injectable, inject } from 'tsyringe';
import { IGetVehicleTypeUseCase } from '../../interface/vehicle_type/get_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { VehicleTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting vehicle type by ID
 * Retrieves a specific vehicle type
 */
@injectable()
export class GetVehicleTypeUseCase implements IGetVehicleTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(vehicleTypeId: string): Promise<VehicleTypeResponse> {
    const vehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Vehicle type fetch attempt for non-existent ID: ${vehicleTypeId}`);
      throw new Error(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND);
    }

    logger.info(`Vehicle type fetched: ${vehicleType.name} (${vehicleTypeId})`);

    return VehicleMapper.toVehicleTypeResponse(vehicleType);
  }
}

