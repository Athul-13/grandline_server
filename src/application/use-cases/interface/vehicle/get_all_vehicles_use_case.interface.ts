import { GetAllVehiclesResponse } from '../../../dtos/vehicle.dto';

export interface IGetAllVehiclesUseCase {
  execute(): Promise<GetAllVehiclesResponse>;
}

