/**
 * Interface for exporting reservation to CSV use case
 */
export interface IExportReservationCSVUseCase {
  execute(reservationId: string): Promise<string>;
}

