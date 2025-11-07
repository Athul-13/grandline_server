export interface IDeleteVehicleUseCase {
  execute(vehicleId: string): Promise<void>;
}

