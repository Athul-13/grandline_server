import { Reservation } from '../../../../domain/entities/reservation.entity';

export interface IStartTripUseCase {
  execute(driverId: string, reservationId: string): Promise<Reservation>;
}

