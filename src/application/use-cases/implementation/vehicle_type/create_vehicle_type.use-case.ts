import { injectable, inject } from 'tsyringe';
import { ICreateVehicleTypeUseCase } from '../../interface/vehicle_type/create_vehicle_type_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { CreateVehicleTypeRequest, CreateVehicleTypeResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { VehicleType } from '../../../../domain/entities/vehicle_type.entity';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for creating vehicle type
 * Creates a new vehicle type in the system
 */
@injectable()
export class CreateVehicleTypeUseCase implements ICreateVehicleTypeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(request: CreateVehicleTypeRequest): Promise<CreateVehicleTypeResponse> {
    // Input validation
    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request.name || typeof request.name !== 'string' || request.name.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check if vehicle type with same name already exists
    const existingVehicleType = await this.vehicleTypeRepository.findByName(request.name.trim());
    
    if (existingVehicleType) {
      logger.warn(`Attempt to create duplicate vehicle type: ${request.name}`);
      throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_ALREADY_EXISTS, ERROR_CODES.INVALID_REQUEST, 409);
    }

    // Generate vehicle type ID
    const vehicleTypeId = randomUUID();
    const now = new Date();

    // Create vehicle type entity
    const vehicleType = new VehicleType(
      vehicleTypeId,
      request.name.trim(),
      request.description?.trim() || '',
      now,
      now
    );

    // Save to repository
    await this.vehicleTypeRepository.create(vehicleType);

    logger.info(`Vehicle type created: ${vehicleType.name} (${vehicleTypeId})`);

    return VehicleMapper.toCreateVehicleTypeResponse(vehicleType);
  }
}

