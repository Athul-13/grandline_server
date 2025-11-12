import { injectable, inject } from 'tsyringe';
import { IGetVehicleTypeUseCase } from '../../interface/vehicle_type/get_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { VehicleTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting vehicle type by ID
 * Retrieves a specific vehicle type
 */
@injectable()
export class GetVehicleTypeUseCase implements IGetVehicleTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(vehicleTypeId: string): Promise<VehicleTypeResponse> {
    // Input validation
    if (!vehicleTypeId || typeof vehicleTypeId !== 'string' || vehicleTypeId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_TYPE_ID, 400);
    }

    const vehicleType = await this.vehicleTypeRepository.findById(vehicleTypeId);
    
    if (!vehicleType) {
      logger.warn(`Vehicle type fetch attempt for non-existent ID: ${vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    // Get vehicles count for this type
    const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleTypeId);
    const vehicleCount = vehicles.length;

    logger.info(`Vehicle type fetched: ${vehicleType.name} (${vehicleTypeId})`);

    return VehicleMapper.toVehicleTypeResponse(vehicleType, vehicleCount);
  }
}

