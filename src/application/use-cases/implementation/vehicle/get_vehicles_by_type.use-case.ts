import { injectable, inject } from 'tsyringe';
import { IGetVehiclesByTypeUseCase } from '../../interface/vehicle/get_vehicles_by_type_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { GetVehiclesByTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

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
    // Input validation
    if (!vehicleTypeId || typeof vehicleTypeId !== 'string' || vehicleTypeId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_TYPE_ID, 400);
    }

    // Validate vehicle type exists
    const vehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Attempt to get vehicles for invalid vehicle type: ${vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.INVALID_VEHICLE_TYPE, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    // Get vehicles by type
    const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleTypeId);
    
    logger.info(`Fetched ${vehicles.length} vehicles for type: ${vehicleType.name}`);

    return VehicleMapper.toGetVehiclesByTypeResponse(vehicles, vehicleType);
  }
}

