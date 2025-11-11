import { GenerateVehicleImageUploadUrlResponse } from '../../../dtos/vehicle.dto';

export interface IGenerateVehicleImageUploadUrlUseCase {
  execute(): Promise<GenerateVehicleImageUploadUrlResponse>;
}

