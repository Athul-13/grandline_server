import { ReservationResponse } from '../../../dtos/reservation.dto';

/**
 * Interface for getting reservation use case
 */
export interface IGetReservationUseCase {
  execute(reservationId: string, userId: string): Promise<ReservationResponse>;
}

