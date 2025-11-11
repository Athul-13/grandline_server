import { CreateVehicleRequest, CreateVehicleResponse } from '../../../dtos/vehicle.dto';

export interface ICreateVehicleUseCase {
  execute(request: CreateVehicleRequest): Promise<CreateVehicleResponse>;
}

