import { Reservation } from '../../../../../domain/entities/reservation.entity';
import { ReservationStatus } from '../../../../../shared/constants';

/**
 * Interface for updating reservation status use case
 */
export interface IUpdateReservationStatusUseCase {
  execute(
    reservationId: string,
    status: ReservationStatus,
    adminUserId: string,
    reason?: string
  ): Promise<Reservation>;
}

