import { Reservation } from '../../../../domain/entities/reservation.entity';

/**
 * Interface for creating reservation use case
 */
export interface ICreateReservationUseCase {
  execute(
    quoteId: string,
    paymentId: string
  ): Promise<Reservation>;
}

