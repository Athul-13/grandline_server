import { ReservationStatus } from '../../shared/constants';
import { Reservation } from '../entities/reservation.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Reservation entity operations
 * Defines the contract for data access layer implementations
 */
export interface IReservationRepository extends IBaseRepository<Reservation> {
  /**
   * Finds reservations by user ID with pagination
   */
  findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ reservations: Reservation[]; total: number }>;

  /**
   * Finds reservation by quote ID
   */
  findByQuoteId(quoteId: string): Promise<Reservation | null>;

  /**
   * Finds reservation by payment ID
   */
  findByPaymentId(paymentId: string): Promise<Reservation | null>;

  /**
   * Finds reservations by status
   */
  findByStatus(status: ReservationStatus): Promise<Reservation[]>;

  /**
   * Finds reservations by user ID and status
   */
  findByUserIdAndStatus(
    userId: string,
    status: ReservationStatus
  ): Promise<Reservation[]>;

  /**
   * Finds all reservations for admin view with pagination and filters
   */
  findAllForAdmin(
    page: number,
    limit: number,
    includeDeleted?: boolean,
    statuses?: ReservationStatus[],
    userIds?: string[],
    searchQuery?: string
  ): Promise<{ reservations: Reservation[]; total: number }>;

  /**
   * Finds driver IDs that are booked during the specified date range
   * Uses MongoDB aggregation to efficiently find overlapping bookings
   * @returns Set of driver IDs that are booked during the date range
   */
  findBookedDriverIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string
  ): Promise<Set<string>>;
}

