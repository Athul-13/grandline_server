import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';

/**
 * Interface for getting reservation charges use case
 */
export interface IGetReservationChargesUseCase {
  execute(reservationId: string): Promise<ReservationCharge[]>;
}

