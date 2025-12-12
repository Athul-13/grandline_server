import { ReservationListResponse } from '../../../dtos/reservation.dto';

/**
 * Interface for getting reservations list use case
 */
export interface IGetReservationsListUseCase {
  execute(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<ReservationListResponse>;
}

