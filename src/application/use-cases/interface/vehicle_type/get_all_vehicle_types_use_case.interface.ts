import { GetAllVehicleTypesResponse } from '../../../dtos/vehicle.dto';

export interface IGetAllVehicleTypesUseCase {
  execute(page?: number, limit?: number): Promise<GetAllVehicleTypesResponse>;
}

