import { GetVehicleFilterOptionsResponse } from '../../../dtos/vehicle.dto';

/**
 * Use case interface for getting vehicle filter options
 */
export interface IGetVehicleFilterOptionsUseCase {
  /**
   * Executes the use case to get all available filter options
   */
  execute(): Promise<GetVehicleFilterOptionsResponse>;
}

