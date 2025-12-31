import { DriverReservationDetailsResponse } from '../../../dtos/driver_reservation.dto';

export interface IGetDriverReservationUseCase {
  execute(driverId: string, reservationId: string): Promise<DriverReservationDetailsResponse>;
}

