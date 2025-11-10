import { injectable, inject } from 'tsyringe';
import { IGetVehicleFilterOptionsUseCase } from '../../interface/vehicle/get_vehicle_filter_options_use_case.interface';
import { IVehicleRepository } from '../../../../domain/repositories/vehicle_repository.interface';
import { IVehicleTypeRepository } from '../../../../domain/repositories/vehicle_type_repository.interface';
import {
  GetVehicleFilterOptionsResponse,
  CheckboxFilterOption,
  RangeFilterOption,
  NumberFilterOption,
  FilterOption,
} from '../../../dtos/vehicle.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { VehicleStatus, VEHICLE_STATUS_LABELS } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting vehicle filter options
 * Retrieves all available filter options for vehicle filtering
 */
@injectable()
export class GetVehicleFilterOptionsUseCase implements IGetVehicleFilterOptionsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IVehicleRepository)
    private readonly vehicleRepository: IVehicleRepository,
    @inject(REPOSITORY_TOKENS.IVehicleTypeRepository)
    private readonly vehicleTypeRepository: IVehicleTypeRepository,
  ) {}

  async execute(): Promise<GetVehicleFilterOptionsResponse> {
    const filters: FilterOption[] = [];

    // Build all filter options
    filters.push(this.buildStatusFilter());
    filters.push(await this.buildVehicleTypeFilter());
    filters.push(await this.buildYearFilter());
    filters.push(await this.buildCapacityFilter());

    logger.info(`Generated ${filters.length} filter options`);

    return {
      success: true,
      filters,
    };
  }

  /**
   * Builds status filter option (checkbox type)
   * Uses VehicleStatus enum values with user-friendly labels
   */
  private buildStatusFilter(): CheckboxFilterOption {
    return {
      key: 'status',
      label: 'Status',
      type: 'checkbox',
      options: Object.values(VehicleStatus).map((status) => ({
        value: status,
        label: VEHICLE_STATUS_LABELS[status],
      })),
    };
  }

  /**
   * Builds vehicle type filter option (checkbox type)
   * Fetches vehicle types from database
   */
  private async buildVehicleTypeFilter(): Promise<CheckboxFilterOption> {
    const vehicleTypes = await this.vehicleTypeRepository.findAll();

    return {
      key: 'vehicleTypeId',
      label: 'Vehicle Type',
      type: 'checkbox',
      options: vehicleTypes.map((type) => ({
        value: type.vehicleTypeId,
        label: type.name,
      })),
    };
  }

  /**
   * Builds year filter option (range type)
   * Fetches min/max year from database using aggregation
   */
  private async buildYearFilter(): Promise<RangeFilterOption> {
    const { min, max } = await this.vehicleRepository.getMinMaxYear();

    return {
      key: 'year',
      label: 'Year',
      type: 'range',
      min,
      max,
      step: 1,
      placeholder: {
        min: 'Min Year',
        max: 'Max Year',
      },
    };
  }

  /**
   * Builds capacity filter option (number type)
   * Fetches min/max capacity from database using aggregation
   */
  private async buildCapacityFilter(): Promise<NumberFilterOption> {
    const { min, max } = await this.vehicleRepository.getMinMaxCapacity();

    return {
      key: 'capacity',
      label: 'Capacity',
      type: 'number',
      min,
      max,
      operator: 'min',
      step: 1,
      placeholder: 'Minimum capacity',
    };
  }
}

