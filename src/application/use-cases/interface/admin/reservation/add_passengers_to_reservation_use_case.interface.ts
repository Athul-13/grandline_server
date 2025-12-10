import { Reservation } from '../../../../../domain/entities/reservation.entity';

/**
 * Passenger data for adding to reservation
 */
export interface PassengerData {
  fullName: string;
  phoneNumber: string;
  age: number;
}

/**
 * Interface for adding passengers to reservation use case
 */
export interface IAddPassengersToReservationUseCase {
  execute(
    reservationId: string,
    passengers: PassengerData[],
    adminUserId: string
  ): Promise<Reservation>;
}

