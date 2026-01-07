export interface IRecordDriverPayoutUseCase {
  execute(driverId: string, paymentDate: Date): Promise<void>;
}