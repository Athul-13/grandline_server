import { Passenger } from '../entities/passenger.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Passenger entity operations
 * Defines the contract for data access layer implementations
 */
export interface IPassengerRepository extends IBaseRepository<Passenger> {
  /**
   * Finds all passengers for a quote
   */
  findByQuoteId(quoteId: string): Promise<Passenger[]>;

  /**
   * Finds all passengers for a reservation
   */
  findByReservationId(reservationId: string): Promise<Passenger[]>;

  /**
   * Deletes all passengers for a quote
   */
  deleteByQuoteId(quoteId: string): Promise<void>;

  /**
   * Deletes all passengers for a reservation
   */
  deleteByReservationId(reservationId: string): Promise<void>;
}

