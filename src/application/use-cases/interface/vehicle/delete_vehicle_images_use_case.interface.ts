export interface IDeleteVehicleImagesUseCase {
  execute(urls: string[]): Promise<void>;
}

