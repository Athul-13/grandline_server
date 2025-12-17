import { QuoteStatus } from '../../../shared/constants';
import {
  DateRange,
  RevenueMetrics,
  QuoteConversionRates,
} from '../../../application/dtos/dashboard.dto';
import { QuoteQueryBuilder } from './quote.repository.queries';

/**
 * Analytics query builders for Quote Repository
 * Handles: Revenue, Conversion, Trends, Vehicle, User analytics
 */
export class QuoteAnalyticsBuilder {
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
    _id: QuoteStatus;
    count: number;
  }>): Map<QuoteStatus, number> {
    const countsMap = new Map<QuoteStatus, number>();

    // Initialize all statuses with 0
    Object.values(QuoteStatus).forEach((status) => {
      countsMap.set(status, 0);
    });

    // Set actual counts
    result.forEach((item) => {
      countsMap.set(item._id, item.count);
    });

    return countsMap;
  }

  // ============================================================================
  // REVENUE ANALYTICS
  // ============================================================================

  /**
   * Builds revenue filter (only PAID quotes with pricing)
   */
  static buildRevenueFilter(timeRange?: DateRange): Record<string, unknown> {
    return {
      isDeleted: false,
      status: QuoteStatus.PAID,
      'pricing.total': { $exists: true, $ne: null },
      ...QuoteQueryBuilder.buildDateRangeFilter(timeRange),
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
          totalRevenue: { $sum: '$pricing.total' },
          averageValue: { $avg: '$pricing.total' },
          minValue: { $min: '$pricing.total' },
          maxValue: { $max: '$pricing.total' },
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
          draft: {
            $sum: {
              $cond: [{ $eq: ['$status', QuoteStatus.DRAFT] }, 1, 0],
            },
          },
          submitted: {
            $sum: {
              $cond: [{ $eq: ['$status', QuoteStatus.SUBMITTED] }, 1, 0],
            },
          },
          quoted: {
            $sum: {
              $cond: [{ $eq: ['$status', QuoteStatus.QUOTED] }, 1, 0],
            },
          },
          paid: {
            $sum: {
              $cond: [{ $eq: ['$status', QuoteStatus.PAID] }, 1, 0],
            },
          },
        },
      },
    ];
  }

  /**
   * Aggregates conversion rates
   */
  static aggregateConversionRates(result: Array<{
    draft: number;
    submitted: number;
    quoted: number;
    paid: number;
  }>): QuoteConversionRates {
    if (result.length === 0) {
      return {
        draftToSubmitted: 0,
        submittedToQuoted: 0,
        quotedToPaid: 0,
        overallConversion: 0,
      };
    }

    const data = result[0];
    const draftToSubmitted = data.draft > 0 ? (data.submitted / data.draft) * 100 : 0;
    const submittedToQuoted = data.submitted > 0 ? (data.quoted / data.submitted) * 100 : 0;
    const quotedToPaid = data.quoted > 0 ? (data.paid / data.quoted) * 100 : 0;
    const overallConversion = data.draft > 0 ? (data.paid / data.draft) * 100 : 0;

    return {
      draftToSubmitted,
      submittedToQuoted,
      quotedToPaid,
      overallConversion,
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
    const filter = {
      isDeleted: false,
      ...QuoteQueryBuilder.buildDateRangeFilter(timeRange),
    };

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
                    { $eq: ['$status', QuoteStatus.PAID] },
                    { $ne: ['$pricing.total', null] },
                  ],
                },
                '$pricing.total',
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
        return '%Y-%U'; // Year-Week
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
      isDeleted: false,
      'selectedVehicles.0': { $exists: true },
      ...QuoteQueryBuilder.buildDateRangeFilter(timeRange),
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
                    { $eq: ['$status', QuoteStatus.PAID] },
                    { $ne: ['$pricing.total', null] },
                  ],
                },
                {
                  $cond: [
                    { $gt: ['$totalVehiclesCount', 0] },
                    {
                      $multiply: [
                        '$pricing.total',
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
          quoteCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$status', QuoteStatus.PAID] },
                    { $ne: ['$pricing.total', null] },
                  ],
                },
                '$pricing.total',
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
          quoteCount: 1,
          totalRevenue: 1,
          _id: 0,
        },
      },
    ];
  }
}

