import { injectable, inject } from 'tsyringe';
import { IGetAllVehiclesUseCase } from '../../interface/vehicle/get_all_vehicles_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { GetAllVehiclesResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting all vehicles
 * Retrieves all vehicles in the system
 */
@injectable()
export class GetAllVehiclesUseCase implements IGetAllVehiclesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(): Promise<GetAllVehiclesResponse> {
    const vehicles = await this.vehicleRepository.findAll();
    
    logger.info(`Fetched ${vehicles.length} vehicles`);

    return VehicleMapper.toGetAllVehiclesResponse(vehicles);
  }
}

