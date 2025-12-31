import { ReservationStatus } from '../../shared/constants';
import { Reservation } from '../entities/reservation.entity';
import { IBaseRepository } from './base_repository.interface';
import {
  DateRange,
  RevenueMetrics,
  ReservationConversionRates,
  TimeTrend,
  GeographicData,
  VehicleAnalytics,
  UserAnalytics,
  RefundAnalytics,
} from '../../application/dtos/dashboard.dto';

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
   * Finds all reservations assigned to a driver (driver dashboard / driver app)
   */
  findByAssignedDriverId(driverId: string): Promise<Reservation[]>;

  /**
   * Finds all reservations for admin view with pagination and filters
   * @param excludePastTrips If true, excludes reservations with completedAt != null (default: true)
   * Note: tripEndAt < now filtering is done in use case after deriving from itinerary
   */
  findAllForAdmin(
    page: number,
    limit: number,
    includeDeleted?: boolean,
    statuses?: ReservationStatus[],
    userIds?: string[],
    searchQuery?: string,
    excludePastTrips?: boolean
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

  /**
   * Gets counts of reservations grouped by status
   */
  getCountsByStatus(timeRange?: DateRange): Promise<Map<ReservationStatus, number>>;

  /**
   * Gets revenue metrics for reservations
   */
  getRevenueMetrics(timeRange?: DateRange): Promise<RevenueMetrics>;

  /**
   * Gets conversion rates for reservations
   */
  getConversionRates(timeRange?: DateRange): Promise<ReservationConversionRates>;

  /**
   * Gets time-based trends for reservations
   */
  getTimeBasedTrends(timeRange: DateRange, granularity: 'day' | 'week' | 'month'): Promise<TimeTrend[]>;

  /**
   * Gets geographic analytics for reservations
   */
  getGeographicAnalytics(timeRange?: DateRange): Promise<GeographicData[]>;

  /**
   * Gets vehicle analytics for reservations
   */
  getVehicleAnalytics(timeRange?: DateRange): Promise<VehicleAnalytics[]>;

  /**
   * Gets user analytics for reservations
   */
  getUserAnalytics(timeRange?: DateRange): Promise<UserAnalytics[]>;

  /**
   * Gets refund analytics for reservations
   */
  getRefundAnalytics(timeRange?: DateRange): Promise<RefundAnalytics>;

  /**
   * Finds all active trips (started but not completed)
   * Active trips are those with startedAt set and completedAt null
   */
  findActiveTrips(): Promise<Reservation[]>;
}

