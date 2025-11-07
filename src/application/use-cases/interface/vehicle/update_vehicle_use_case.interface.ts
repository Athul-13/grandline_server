import { UpdateVehicleRequest, UpdateVehicleResponse } from '../../../dtos/vehicle.dto';

export interface IUpdateVehicleUseCase {
  execute(vehicleId: string, request: UpdateVehicleRequest): Promise<UpdateVehicleResponse>;
}

