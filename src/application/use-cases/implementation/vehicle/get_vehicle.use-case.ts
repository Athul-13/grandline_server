import { injectable, inject } from 'tsyringe';
import { IGetVehicleUseCase } from '../../interface/vehicle/get_vehicle_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { GetVehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

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
    // Input validation
    if (!vehicleId || typeof vehicleId !== 'string' || vehicleId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_VEHICLE_ID, 400);
    }

    const vehicle = await this.vehicleRepository.findById(vehicleId);
    
    if (!vehicle) {
      logger.warn(`Vehicle fetch attempt for non-existent ID: ${vehicleId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_NOT_FOUND, ERROR_CODES.VEHICLE_NOT_FOUND, 404);
    }

    // Fetch vehicle type
    const vehicleType = await this.vehicleTypeRepository.findById(vehicle.vehicleTypeId);
    if (!vehicleType) {
      logger.error(`Vehicle type not found for vehicle: ${vehicleId}, vehicleTypeId: ${vehicle.vehicleTypeId}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
    }

    logger.info(`Vehicle fetched: ${vehicle.plateNumber} (${vehicleId})`);

    return VehicleMapper.toGetVehicleResponse(vehicle, vehicleType);
  }
}

