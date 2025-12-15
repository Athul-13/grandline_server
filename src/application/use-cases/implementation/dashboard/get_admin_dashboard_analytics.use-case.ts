import { injectable, inject } from 'tsyringe';
import { IGetAdminDashboardAnalyticsUseCase } from '../../interface/dashboard/get_admin_dashboard_analytics_use_case.interface';
import {
  AdminDashboardAnalyticsRequest,
  AdminDashboardAnalyticsResponse,
  QuoteAnalytics,
  ReservationAnalytics,
  OverallMetrics,
  DateRange,
} from '../../../dtos/dashboard.dto';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';

/**
 * Use case for getting admin dashboard analytics
 * Calculates comprehensive analytics for quotes and reservations
 */
@injectable()
export class GetAdminDashboardAnalyticsUseCase implements IGetAdminDashboardAnalyticsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(request?: AdminDashboardAnalyticsRequest): Promise<AdminDashboardAnalyticsResponse> {
    logger.info('Admin dashboard analytics fetch request', { request });

    // Calculate date range from request
    const dateRange = this.calculateDateRange(request);

    // Fetch all analytics data in parallel
    const [
      quoteCountsByStatus,
      quoteRevenueMetrics,
      quoteConversionRates,
      quoteTimeTrends,
      quoteGeographicData,
      quoteVehicleAnalytics,
      quoteUserAnalytics,
      reservationCountsByStatus,
      reservationRevenueMetrics,
      reservationConversionRates,
      reservationTimeTrends,
      reservationGeographicData,
      reservationVehicleAnalytics,
      reservationUserAnalytics,
      refundAnalytics,
    ] = await Promise.all([
      this.quoteRepository.getCountsByStatus(dateRange),
      this.quoteRepository.getRevenueMetrics(dateRange),
      this.quoteRepository.getConversionRates(dateRange),
      this.quoteRepository.getTimeBasedTrends(dateRange, 'day'),
      this.quoteRepository.getGeographicAnalytics(dateRange),
      this.quoteRepository.getVehicleAnalytics(dateRange),
      this.quoteRepository.getUserAnalytics(dateRange),
      this.reservationRepository.getCountsByStatus(dateRange),
      this.reservationRepository.getRevenueMetrics(dateRange),
      this.reservationRepository.getConversionRates(dateRange),
      this.reservationRepository.getTimeBasedTrends(dateRange, 'day'),
      this.reservationRepository.getGeographicAnalytics(dateRange),
      this.reservationRepository.getVehicleAnalytics(dateRange),
      this.reservationRepository.getUserAnalytics(dateRange),
      this.reservationRepository.getRefundAnalytics(dateRange),
    ]);

    // Build quotes analytics
    const quotesAnalytics: QuoteAnalytics = {
      countsByStatus: this.mapToObject(quoteCountsByStatus),
      totalCount: Array.from(quoteCountsByStatus.values()).reduce((sum, count) => sum + count, 0),
      revenueMetrics: quoteRevenueMetrics,
      conversionRates: quoteConversionRates,
      timeBasedTrends: quoteTimeTrends,
      geographicData: quoteGeographicData,
      vehicleAnalytics: quoteVehicleAnalytics,
      userAnalytics: {
        topCustomers: quoteUserAnalytics,
        repeatCustomers: this.calculateRepeatCustomers(quoteUserAnalytics),
        newCustomers: 0, // Would need user creation dates to calculate properly
      },
    };

    // Build reservations analytics
    const reservationsAnalytics: ReservationAnalytics = {
      countsByStatus: this.mapToObject(reservationCountsByStatus),
      totalCount: Array.from(reservationCountsByStatus.values()).reduce((sum, count) => sum + count, 0),
      revenueMetrics: reservationRevenueMetrics,
      conversionRates: reservationConversionRates,
      timeBasedTrends: reservationTimeTrends,
      geographicData: reservationGeographicData,
      vehicleAnalytics: reservationVehicleAnalytics,
      userAnalytics: {
        topCustomers: reservationUserAnalytics,
        repeatCustomers: this.calculateRepeatCustomers(reservationUserAnalytics),
      },
      refundAnalytics,
    };

    // Calculate overall metrics
    const overallMetrics: OverallMetrics = {
      totalQuotes: quotesAnalytics.totalCount,
      totalReservations: reservationsAnalytics.totalCount,
      totalRevenue: quoteRevenueMetrics.totalRevenue + reservationRevenueMetrics.totalRevenue,
      quoteToReservationConversionRate:
        quotesAnalytics.totalCount > 0
          ? (reservationsAnalytics.totalCount / quotesAnalytics.totalCount) * 100
          : 0,
      averageQuoteValue: quoteRevenueMetrics.averageValue,
      averageReservationValue: reservationRevenueMetrics.averageValue,
    };

    logger.info('Admin dashboard analytics calculated successfully');

    return {
      quotesAnalytics,
      reservationsAnalytics,
      overallMetrics,
    };
  }

  /**
   * Calculates date range from request parameters
   */
  private calculateDateRange(request?: AdminDashboardAnalyticsRequest): DateRange {
    const now = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (request?.timeRange === '7_days') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (request?.timeRange === '30_days') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (request?.timeRange === 'custom' && request.startDate && request.endDate) {
      startDate = new Date(request.startDate);
      endDate = new Date(request.endDate);
    }
    // 'all_time' or undefined means no date range filter

    return { startDate, endDate };
  }

  /**
   * Converts Map to plain object
   */
  private mapToObject<T>(map: Map<T, number>): { [key: string]: number } {
    const obj: { [key: string]: number } = {};
    map.forEach((value, key) => {
      obj[String(key)] = value;
    });
    return obj;
  }

  /**
   * Calculates repeat customers (users with more than 1 quote/reservation)
   */
  private calculateRepeatCustomers(userAnalytics: Array<{ userId: string; quoteCount?: number; reservationCount?: number }>): number {
    return userAnalytics.filter((user) => (user.quoteCount || user.reservationCount || 0) > 1).length;
  }
}

