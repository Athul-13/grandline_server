import { Reservation } from '../../../../../domain/entities/reservation.entity';

/**
 * Interface for processing reservation refund use case
 */
export interface IProcessReservationRefundUseCase {
  execute(
    reservationId: string,
    amount: number,
    adminUserId: string,
    reason?: string
  ): Promise<{ reservation: Reservation; refundId: string }>;
}

