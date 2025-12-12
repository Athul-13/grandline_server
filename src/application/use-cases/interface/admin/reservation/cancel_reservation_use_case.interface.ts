import { Reservation } from '../../../../../domain/entities/reservation.entity';

/**
 * Interface for cancelling reservation use case
 */
export interface ICancelReservationUseCase {
  execute(
    reservationId: string,
    reason: string,
    adminUserId: string
  ): Promise<Reservation>;
}

