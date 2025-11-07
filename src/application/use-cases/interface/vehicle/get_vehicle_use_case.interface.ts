import { GetVehicleResponse } from '../../../dtos/vehicle.dto';

export interface IGetVehicleUseCase {
  execute(vehicleId: string): Promise<GetVehicleResponse>;
}

