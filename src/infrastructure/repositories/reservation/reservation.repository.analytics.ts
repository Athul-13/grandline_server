import { ReservationStatus } from '../../../shared/constants';
import {
  DateRange,
  RevenueMetrics,
  ReservationConversionRates,
  RefundAnalytics,
} from '../../../application/dtos/dashboard.dto';
import { ReservationQueryBuilder } from './reservation.repository.queries';

/**
 * Analytics query builders for Reservation Repository
 * Handles: Revenue, Conversion, Trends, Vehicle, User, Refund analytics
 * 
 * ORGANIZATION:
 * - Revenue Analytics: Metrics calculation and aggregation
 * - Conversion Analytics: Conversion rate calculations
 * - Time-based Trends: Trend analysis by time granularity
 * - Vehicle Analytics: Vehicle usage and revenue analytics
 * - User Analytics: User behavior and revenue analytics
 * - Refund Analytics: Refund metrics and calculations
 * - Status Analytics: Status count aggregations
 */
export class ReservationAnalyticsBuilder {
  // ============================================================================
  // REVENUE ANALYTICS
  // ============================================================================

  /**
   * Builds revenue filter (excludes cancelled, requires pricing)
   */
  static buildRevenueFilter(timeRange?: DateRange): Record<string, unknown> {
    return {
      'originalPricing.total': { $exists: true, $ne: null },
      status: { $ne: ReservationStatus.CANCELLED },
      ...ReservationQueryBuilder.buildDateRangeFilter(timeRange),
    };
  }

  /**
   * Builds revenue aggregation pipeline
   */
  static buildRevenuePipeline(filter: Record<string, unknown>): Record<string, unknown>[] {
    return [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$originalPricing.total' },
          averageValue: { $avg: '$originalPricing.total' },
          minValue: { $min: '$originalPricing.total' },
          maxValue: { $max: '$originalPricing.total' },
        },
      },
    ];
  }

  /**
   * Aggregates revenue metrics from pipeline result
   */
  static aggregateRevenueMetrics(result: Array<{
    totalRevenue: number;
    averageValue: number;
    minValue: number;
    maxValue: number;
  }>): RevenueMetrics {
    if (result.length === 0) {
      return {
        totalRevenue: 0,
        averageValue: 0,
        minValue: 0,
        maxValue: 0,
      };
    }

    return {
      totalRevenue: result[0].totalRevenue || 0,
      averageValue: result[0].averageValue || 0,
      minValue: result[0].minValue || 0,
      maxValue: result[0].maxValue || 0,
    };
  }

  // ============================================================================
  // STATUS ANALYTICS
  // ============================================================================

  /**
   * Builds counts by status pipeline
   */
  static buildCountsByStatusPipeline(filter: Record<string, unknown>): Record<string, unknown>[] {
    return [
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];
  }

  /**
   * Aggregates counts by status into Map
   */
  static aggregateCountsByStatus(result: Array<{
    _id: ReservationStatus;
    count: number;
  }>): Map<ReservationStatus, number> {
    const countsMap = new Map<ReservationStatus, number>();

    // Initialize all statuses with 0
    Object.values(ReservationStatus).forEach((status) => {
      countsMap.set(status, 0);
    });

    // Set actual counts
    result.forEach((item) => {
      countsMap.set(item._id, item.count);
    });

    return countsMap;
  }

  // ============================================================================
  // CONVERSION ANALYTICS
  // ============================================================================

  /**
   * Builds conversion rates pipeline
   */
  static buildConversionPipeline(filter: Record<string, unknown>): Record<string, unknown>[] {
    return [
      { $match: filter },
      {
        $group: {
          _id: null,
          confirmed: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.CONFIRMED] }, 1, 0],
            },
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.COMPLETED] }, 1, 0],
            },
          },
          cancelled: {
            $sum: {
              $cond: [{ $eq: ['$status', ReservationStatus.CANCELLED] }, 1, 0],
            },
          },
          total: { $sum: 1 },
        },
      },
    ];
  }

  /**
   * Aggregates conversion rates
   */
  static aggregateConversionRates(result: Array<{
    confirmed: number;
    completed: number;
    cancelled: number;
    total: number;
  }>): ReservationConversionRates {
    if (result.length === 0) {
      return {
        quoteToReservation: 0,
        confirmedToCompleted: 0,
        cancellationRate: 0,
      };
    }

    const data = result[0];
    const confirmedToCompleted =
      data.confirmed > 0 ? (data.completed / data.confirmed) * 100 : 0;
    const cancellationRate = data.total > 0 ? (data.cancelled / data.total) * 100 : 0;

    return {
      quoteToReservation: 0, // Would need quote count to calculate properly
      confirmedToCompleted,
      cancellationRate,
    };
  }

  // ============================================================================
  // TIME-BASED TRENDS
  // ============================================================================

  /**
   * Builds time-based trends pipeline
   */
  static buildTimeTrendPipeline(
    timeRange: DateRange,
    granularity: 'day' | 'week' | 'month'
  ): Record<string, unknown>[] {
    const dateFormat = this.getDateFormat(granularity);
    const filter = ReservationQueryBuilder.buildDateRangeFilter(timeRange);

    return [
      { $match: filter },
      {
        $group: {
          _id: {
            $dateToString: { format: dateFormat, date: '$createdAt' },
          },
          count: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$originalPricing.total', null] },
                    { $ne: ['$status', ReservationStatus.CANCELLED] },
                  ],
                },
                '$originalPricing.total',
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: '$_id',
          count: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ];
  }

  /**
   * Gets date format string based on granularity
   */
  private static getDateFormat(granularity: 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-%U';
      case 'month':
        return '%Y-%m';
      default:
        return '%Y-%m-%d';
    }
  }

  // ============================================================================
  // VEHICLE ANALYTICS
  // ============================================================================

  /**
   * Builds vehicle analytics filter
   */
  static buildVehicleFilter(timeRange?: DateRange): Record<string, unknown> {
    return {
      'selectedVehicles.0': { $exists: true },
      ...ReservationQueryBuilder.buildDateRangeFilter(timeRange),
    };
  }

  /**
   * Builds vehicle analytics pipeline
   */
  static buildVehiclePipeline(filter: Record<string, unknown>): Record<string, unknown>[] {
    return [
      { $match: filter },
      // Calculate total vehicles count before unwinding
      {
        $addFields: {
          totalVehiclesCount: { $size: { $ifNull: ['$selectedVehicles', []] } },
        },
      },
      { $unwind: '$selectedVehicles' },
      {
        $group: {
          _id: '$selectedVehicles.vehicleId',
          count: { $sum: '$selectedVehicles.quantity' },
          revenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$originalPricing.total', null] },
                    { $ne: ['$status', ReservationStatus.CANCELLED] },
                  ],
                },
                {
                  $cond: [
                    { $gt: ['$totalVehiclesCount', 0] },
                    {
                      $multiply: [
                        '$originalPricing.total',
                        {
                          $divide: ['$selectedVehicles.quantity', '$totalVehiclesCount'],
                        },
                      ],
                    },
                    0,
                  ],
                },
                0,
              ],
            },
          },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          vehicleId: '$_id',
          count: 1,
          revenue: 1,
          _id: 0,
        },
      },
    ];
  }

  // ============================================================================
  // USER ANALYTICS
  // ============================================================================

  /**
   * Builds user analytics pipeline
   */
  static buildUserPipeline(filter: Record<string, unknown>): Record<string, unknown>[] {
    return [
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          reservationCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$originalPricing.total', null] },
                    { $ne: ['$status', ReservationStatus.CANCELLED] },
                  ],
                },
                '$originalPricing.total',
                0,
              ],
            },
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $project: {
          userId: '$_id',
          reservationCount: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
    ];
  }

  // ============================================================================
  // REFUND ANALYTICS
  // ============================================================================

  /**
   * Builds refund filter
   */
  static buildRefundFilter(timeRange?: DateRange): Record<string, unknown> {
    return {
      refundStatus: { $ne: 'none' },
      ...ReservationQueryBuilder.buildDateRangeFilter(timeRange, 'refundedAt'),
    };
  }

  /**
   * Builds refund analytics pipeline
   */
  static buildRefundPipeline(filter: Record<string, unknown>): Record<string, unknown>[] {
    return [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundedAmount' },
          averageRefundAmount: { $avg: '$refundedAmount' },
          partial: {
            $sum: {
              $cond: [{ $eq: ['$refundStatus', 'partial'] }, 1, 0],
            },
          },
          full: {
            $sum: {
              $cond: [{ $eq: ['$refundStatus', 'full'] }, 1, 0],
            },
          },
          totalRefunds: { $sum: 1 },
        },
      },
    ];
  }

  /**
   * Aggregates refund analytics
   */
  static aggregateRefundAnalytics(
    result: Array<{
      totalRefunded: number;
      averageRefundAmount: number;
      partial: number;
      full: number;
      totalRefunds: number;
    }>,
    totalReservations: number
  ): RefundAnalytics {
    if (result.length === 0) {
      return {
        totalRefunded: 0,
        refundRate: 0,
        refundsByStatus: {},
        averageRefundAmount: 0,
      };
    }

    const data = result[0];
    const refundRate =
      totalReservations > 0 ? (data.totalRefunds / totalReservations) * 100 : 0;

    return {
      totalRefunded: data.totalRefunded || 0,
      refundRate,
      refundsByStatus: {
        partial: data.partial || 0,
        full: data.full || 0,
      },
      averageRefundAmount: data.averageRefundAmount || 0,
    };
  }
}

