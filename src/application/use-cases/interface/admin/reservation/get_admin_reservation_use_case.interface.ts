import { AdminReservationDetailsResponse } from '../../../../dtos/reservation.dto';

/**
 * Interface for getting admin reservation details use case
 */
export interface IGetAdminReservationUseCase {
  execute(reservationId: string): Promise<AdminReservationDetailsResponse>;
}

