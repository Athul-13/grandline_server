import { VehicleTypeResponse } from '../../../dtos/vehicle.dto';

export interface IGetAllVehicleTypesUseCase {
  execute(): Promise<VehicleTypeResponse[]>;
}

