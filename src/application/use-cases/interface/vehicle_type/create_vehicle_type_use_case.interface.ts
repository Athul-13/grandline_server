import { CreateVehicleTypeRequest, CreateVehicleTypeResponse } from '../../../dtos/vehicle.dto';

export interface ICreateVehicleTypeUseCase {
  execute(request: CreateVehicleTypeRequest): Promise<CreateVehicleTypeResponse>;
}

