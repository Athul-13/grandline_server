import { UpdateVehicleTypeRequest, VehicleTypeResponse } from '../../../dtos/vehicle.dto';

export interface IUpdateVehicleTypeUseCase {
  execute(vehicleTypeId: string, request: UpdateVehicleTypeRequest): Promise<VehicleTypeResponse>;
}

