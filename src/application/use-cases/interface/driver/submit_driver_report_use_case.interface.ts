import { Reservation } from '../../../../domain/entities/reservation.entity';

/**
 * Interface for submitting driver trip report use case
 */
export interface ISubmitDriverReportUseCase {
  /**
   * Submit a driver report for a completed trip
   * @param driverId - ID of the driver submitting the report
   * @param reservationId - ID of the reservation/trip
   * @param reportContent - Content of the report (free text)
   * @returns Updated reservation entity
   */
  execute(driverId: string, reservationId: string, reportContent: string): Promise<Reservation>;
}

