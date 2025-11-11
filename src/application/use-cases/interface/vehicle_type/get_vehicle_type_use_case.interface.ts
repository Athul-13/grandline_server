import { VehicleTypeResponse } from '../../../dtos/vehicle.dto';

export interface IGetVehicleTypeUseCase {
  execute(vehicleTypeId: string): Promise<VehicleTypeResponse>;
}

