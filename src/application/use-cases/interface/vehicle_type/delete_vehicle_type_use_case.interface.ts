export interface IDeleteVehicleTypeUseCase {
  execute(vehicleTypeId: string): Promise<void>;
}

