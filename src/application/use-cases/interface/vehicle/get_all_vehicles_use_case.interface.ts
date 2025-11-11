import { GetAllVehiclesResponse } from '../../../dtos/vehicle.dto';
import { VehicleFilter } from '../../../../domain/repositories/vehicle_filter.interface';

export interface IGetAllVehiclesUseCase {
  execute(
    page?: number,
    limit?: number,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    filter?: VehicleFilter
  ): Promise<GetAllVehiclesResponse>;
}

