export interface IDeleteDriverUseCase {
  execute(driverId: string): Promise<{ message: string }>;
}

