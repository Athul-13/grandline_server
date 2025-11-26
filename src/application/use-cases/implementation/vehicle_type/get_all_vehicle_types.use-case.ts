import { injectable, inject } from 'tsyringe';
import { IGetAllVehicleTypesUseCase } from '../../interface/vehicle_type/get_all_vehicle_types_use_case.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { GetAllVehicleTypesResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
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
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
  ) {}

  async execute(page: number = 1, limit: number = 20): Promise<GetAllVehicleTypesResponse> {
    // Validate and normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(page) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

    // Fetch all vehicle types
    const allVehicleTypes = await this.vehicleTypeRepository.findAll();
    
    // Get count for each vehicle type in parallel
    const vehicleTypesWithCount = await Promise.all(
      allVehicleTypes.map(async (vehicleType) => {
        const vehicles = await this.vehicleRepository.findByVehicleTypeId(vehicleType.vehicleTypeId);
        const vehicleCount = vehicles.length;
        return VehicleMapper.toVehicleTypeResponse(vehicleType, vehicleCount);
      })
    );

    // Calculate pagination metadata
    const total = vehicleTypesWithCount.length;
    const totalPages = Math.ceil(total / normalizedLimit);

    // Apply pagination (slice array)
    const startIndex = (normalizedPage - 1) * normalizedLimit;
    const endIndex = startIndex + normalizedLimit;
    const paginatedData = vehicleTypesWithCount.slice(startIndex, endIndex);

    logger.info(`Fetched ${paginatedData.length} vehicle types (page ${normalizedPage}, limit ${normalizedLimit}, total ${total})`);

    return {
      data: paginatedData,
      pagination: {
        page: normalizedPage,
        limit: normalizedLimit,
        total,
        totalPages,
      },
    };
  }
}

