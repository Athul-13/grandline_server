/**
 * Interface for exporting reservation to PDF use case
 */
export interface IExportReservationPDFUseCase {
  execute(reservationId: string): Promise<Buffer>;
}

