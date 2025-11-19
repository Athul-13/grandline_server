import { injectable, inject } from 'tsyringe';
import { IGetAllVehiclesUseCase } from '../../interface/vehicle/get_all_vehicles_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import { VehicleFilter } from '../../../../domain/repositories/vehicle_filter.interface';
import { GetAllVehiclesResponse, VehicleResponse } from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { VehicleMapper } from '../../../mapper/vehicle.mapper';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Allowed sort fields for vehicle sorting
 * Whitelist to prevent sorting by invalid fields
 */
const ALLOWED_SORT_FIELDS: readonly string[] = [
  'status',
  'year',
  'capacity',
  'vehicleModel',
  'maintenance',
  'fuelConsumption',
] as const;

/**
 * Use case for getting all vehicles
 * Retrieves all vehicles in the system with pagination and sorting
 */
@injectable()
export class GetAllVehiclesUseCase implements IGetAllVehiclesUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(
    page: number = 1,
    limit: number = 20,
    sortBy?: string,
    sortOrder: 'asc' | 'desc' = 'asc',
    filter?: VehicleFilter
  ): Promise<GetAllVehiclesResponse> {
    // Validate and normalize pagination parameters
    const normalizedPage = Math.max(1, Math.floor(page) || 1);
    const normalizedLimit = Math.max(1, Math.min(100, Math.floor(limit) || 20));

    // Validate sortBy field
    const normalizedSortBy = sortBy && ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : undefined;
    
    // Validate sortOrder
    const normalizedSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

    // Fetch vehicles with filters applied (efficient database-level filtering)
    const allVehicles = filter
      ? await this.vehicleRepository.findWithFilters(filter)
      : await this.vehicleRepository.findAll();
    
    // Fetch all vehicle types (for efficient bulk lookup)
    const allVehicleTypes = await this.vehicleTypeRepository.findAll();
    const vehicleTypeMap = new Map(allVehicleTypes.map(vt => [vt.vehicleTypeId, vt]));
    
    // Map to response DTOs with vehicle types
    let vehiclesData = allVehicles.map(vehicle => {
      const vehicleType = vehicleTypeMap.get(vehicle.vehicleTypeId);
      if (!vehicleType) {
        logger.error(`Vehicle type not found for vehicle: ${vehicle.vehicleId}, vehicleTypeId: ${vehicle.vehicleTypeId}`);
        throw new AppError(ERROR_MESSAGES.VEHICLE_TYPE_NOT_FOUND, ERROR_CODES.VEHICLE_TYPE_NOT_FOUND, 404);
      }
      return VehicleMapper.toVehicleResponse(vehicle, vehicleType);
    });

    // Apply sorting if sortBy is provided
    if (normalizedSortBy) {
      vehiclesData = this.sortVehicles(vehiclesData, normalizedSortBy, normalizedSortOrder);
    }

    // Calculate pagination metadata
    const total = vehiclesData.length;
    const totalPages = Math.ceil(total / normalizedLimit);

    // Apply pagination (slice array)
    const startIndex = (normalizedPage - 1) * normalizedLimit;
    const endIndex = startIndex + normalizedLimit;
    const paginatedData = vehiclesData.slice(startIndex, endIndex);

    logger.info(
      `Fetched ${paginatedData.length} vehicles (page ${normalizedPage}, limit ${normalizedLimit}, total ${total}, sortBy: ${normalizedSortBy || 'none'}, sortOrder: ${normalizedSortOrder}, filters: ${filter ? JSON.stringify(filter) : 'none'})`
    );

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

  /**
   * Sorts vehicles array based on the specified field and order
   * Handles different data types (string, number, enum)
   */
  private sortVehicles(
    vehicles: VehicleResponse[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ): VehicleResponse[] {
    return [...vehicles].sort((a, b) => {
      const aValue = a[sortBy as keyof VehicleResponse];
      const bValue = b[sortBy as keyof VehicleResponse];

      // Handle undefined/null values
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;

      // Handle string comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle number comparison
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        const comparison = aValue - bValue;
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle Date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        const comparison = aValue.getTime() - bValue.getTime();
        return sortOrder === 'asc' ? comparison : -comparison;
      }

      // Handle object types - cannot meaningfully compare, treat as equal
      if (typeof aValue === 'object' || typeof bValue === 'object') {
        return 0;
      }

      // Fallback: convert to string and compare
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }
}

