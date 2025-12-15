import { QuoteStatus, TripType } from '../../shared/constants';
import { Quote } from '../entities/quote.entity';
import { IBaseRepository } from './base_repository.interface';
import {
  DateRange,
  RevenueMetrics,
  QuoteConversionRates,
  TimeTrend,
  GeographicData,
  VehicleAnalytics,
  UserAnalytics,
} from '../../application/dtos/dashboard.dto';

/**
 * Repository interface for Quote entity operations
 * Defines the contract for data access layer implementations
 */
export interface IQuoteRepository extends IBaseRepository<Quote> {
  /**
   * Finds quotes by user ID
   */
  findByUserId(userId: string): Promise<Quote[]>;

  /**
   * Finds quotes by status
   */
  findByStatus(status: QuoteStatus): Promise<Quote[]>;

  /**
   * Finds quotes by user ID and status
   */
  findByUserIdAndStatus(userId: string, status: QuoteStatus): Promise<Quote[]>;

  /**
   * Finds all non-deleted quotes for a user
   */
  findActiveQuotesByUserId(userId: string): Promise<Quote[]>;

  /**
   * Finds all quotes (including deleted) for a user
   */
  findAllQuotesByUserId(userId: string): Promise<Quote[]>;

  /**
   * Soft deletes a quote by setting isDeleted to true
   */
  softDelete(quoteId: string): Promise<void>;

  /**
   * Finds quotes by trip type
   */
  findByTripType(tripType: TripType): Promise<Quote[]>;

  /**
   * Finds all quotes for admin view
   */
  findAllForAdmin(
    includeDeleted: boolean,
    statuses?: QuoteStatus[],
    userIds?: string[]
  ): Promise<Quote[]>;

  /**
   * Finds vehicle IDs that are booked during the specified date range
   * Uses MongoDB aggregation to efficiently find overlapping bookings
   * @returns Set of vehicle IDs that are booked during the date range
   */
  findBookedVehicleIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Promise<Set<string>>;

  /**
   * Finds driver IDs that are booked during the specified date range
   * Uses MongoDB aggregation to efficiently find overlapping bookings
   * @returns Set of driver IDs that are booked during the date range
   */
  findBookedDriverIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Promise<Set<string>>;

  /**
   * Finds vehicle IDs that are temporarily reserved in DRAFT quotes
   * Only includes DRAFT quotes created within the last 30 minutes
   * @returns Set of vehicle IDs that are reserved in recent DRAFT quotes
   */
  findReservedVehicleIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Promise<Set<string>>;

  /**
   * Gets counts of quotes grouped by status
   */
  getCountsByStatus(timeRange?: DateRange): Promise<Map<QuoteStatus, number>>;

  /**
   * Gets revenue metrics for quotes
   */
  getRevenueMetrics(timeRange?: DateRange): Promise<RevenueMetrics>;

  /**
   * Gets conversion rates for quotes
   */
  getConversionRates(timeRange?: DateRange): Promise<QuoteConversionRates>;

  /**
   * Gets time-based trends for quotes
   */
  getTimeBasedTrends(timeRange: DateRange, granularity: 'day' | 'week' | 'month'): Promise<TimeTrend[]>;

  /**
   * Gets geographic analytics for quotes
   */
  getGeographicAnalytics(timeRange?: DateRange): Promise<GeographicData[]>;

  /**
   * Gets vehicle analytics for quotes
   */
  getVehicleAnalytics(timeRange?: DateRange): Promise<VehicleAnalytics[]>;

  /**
   * Gets user analytics for quotes
   */
  getUserAnalytics(timeRange?: DateRange): Promise<UserAnalytics[]>;
}

