import { injectable, inject } from 'tsyringe';
import { IGetAllVehicleTypesUseCase } from '../../interface/vehicle_type/get_all_vehicle_types_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { VehicleTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting all vehicle types
 * Retrieves all vehicle types in the system
 */
@injectable()
export class GetAllVehicleTypesUseCase implements IGetAllVehicleTypesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(): Promise<VehicleTypeResponse[]> {
    const vehicleTypes = await this.vehicleTypeRepository.findAll();
    
    logger.info(`Fetched ${vehicleTypes.length} vehicle types`);

    return vehicleTypes.map(vehicleType => VehicleMapper.toVehicleTypeResponse(vehicleType));
  }
}

