import { UpdateVehicleStatusRequest, UpdateVehicleStatusResponse } from '../../../dtos/vehicle.dto';

export interface IUpdateVehicleStatusUseCase {
  execute(vehicleId: string, request: UpdateVehicleStatusRequest): Promise<UpdateVehicleStatusResponse>;
}

