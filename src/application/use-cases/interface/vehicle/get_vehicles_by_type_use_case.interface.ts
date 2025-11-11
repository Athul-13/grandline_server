import { GetVehiclesByTypeResponse } from '../../../dtos/vehicle.dto';

export interface IGetVehiclesByTypeUseCase {
  execute(vehicleTypeId: string): Promise<GetVehiclesByTypeResponse>;
}

