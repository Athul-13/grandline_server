import { Reservation } from '../../../../../domain/entities/reservation.entity';

/**
 * Interface for changing reservation driver use case
 */
export interface IChangeReservationDriverUseCase {
  execute(
    reservationId: string,
    driverId: string,
    adminUserId: string,
    reason?: string
  ): Promise<Reservation>;
}

