import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';

/**
 * Interface for getting reservation modifications use case
 */
export interface IGetReservationModificationsUseCase {
  execute(reservationId: string): Promise<ReservationModification[]>;
}

