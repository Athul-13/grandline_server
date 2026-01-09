export interface ICalculateDriverEarningsUseCase {
  execute(reservationId: string): Promise<void>;
}