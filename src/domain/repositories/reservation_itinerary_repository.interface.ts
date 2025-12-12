import { ReservationItinerary } from '../entities/reservation_itinerary.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for ReservationItinerary entity operations
 * Defines the contract for data access layer implementations
 */
export interface IReservationItineraryRepository extends IBaseRepository<ReservationItinerary> {
  /**
   * Finds all itinerary stops for a reservation
   */
  findByReservationId(reservationId: string): Promise<ReservationItinerary[]>;

  /**
   * Finds itinerary stops by reservation ID and trip type
   */
  findByReservationIdAndTripType(
    reservationId: string,
    tripType: 'outbound' | 'return'
  ): Promise<ReservationItinerary[]>;

  /**
   * Deletes all itinerary stops for a reservation
   */
  deleteByReservationId(reservationId: string): Promise<void>;

  /**
   * Finds itinerary stops ordered by stopOrder
   */
  findByReservationIdOrdered(reservationId: string): Promise<ReservationItinerary[]>;
}

