import { Reservation } from '../../../../domain/entities/reservation.entity';

export interface IEndTripUseCase {
  execute(driverId: string, reservationId: string): Promise<Reservation>;
}

