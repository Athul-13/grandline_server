import { ReservationStatus } from '../../../shared/constants';
import { DateRange } from '../../../application/dtos/dashboard.dto';

/**
 * Query builders for Reservation Repository
 * Handles: Basic filters, Admin queries, Driver availability
 * 
 * ORGANIZATION:
 * - Basic Query Builders: Date range filters, admin filters
 * - Driver Availability: Complex aggregation pipeline for finding booked drivers
 */
export class ReservationQueryBuilder {
  /**
   * Builds date range filter for queries
   * @param timeRange Optional date range to filter by
   * @param dateField Field name to apply date filter to (default: 'createdAt')
   * @returns MongoDB filter object with date range
   */
  static buildDateRangeFilter(
    timeRange?: DateRange,
    dateField: string = 'createdAt'
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    
    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter[dateField] = dateFilter;
    }
    
    return filter;
  }

  /**
   * Builds admin filter with statuses, userIds, and search query
   * Excludes past trips: completedAt != null OR tripEndAt < now
   * Note: tripEndAt filtering is done in use case after deriving from itinerary
   * @param params Filter parameters
   * @returns MongoDB filter object for admin queries
   */
  static buildAdminFilter(params: {
    statuses?: ReservationStatus[];
    userIds?: string[];
    searchQuery?: string;
    excludePastTrips?: boolean;
  }): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (params.statuses && params.statuses.length > 0) {
      filter.status = { $in: params.statuses };
    }

    if (params.userIds && params.userIds.length > 0) {
      filter.userId = { $in: params.userIds };
    }

    if (params.searchQuery && params.searchQuery.trim().length > 0) {
      filter.$or = [
        { reservationId: { $regex: params.searchQuery, $options: 'i' } },
        { tripName: { $regex: params.searchQuery, $options: 'i' } },
      ];
    }

    // Exclude past trips: completedAt != null
    // Note: tripEndAt < now filtering is done in use case after deriving from itinerary
    if (params.excludePastTrips !== false) {
      filter.completedAt = { $eq: null };
    }

    return filter;
  }

  /**
   * Builds aggregation pipeline to find booked driver IDs in date range
   * Uses complex aggregation with lookup to check itinerary overlaps
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param excludeReservationId Optional reservation ID to exclude from results
   * @returns MongoDB aggregation pipeline
   */
  static buildDriverAvailabilityPipeline(
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string
  ): Record<string, unknown>[] {
    // Statuses that block driver availability
    const blockingStatuses = [
      ReservationStatus.CONFIRMED,
      ReservationStatus.MODIFIED,
    ];

    const matchStage: Record<string, unknown> = {
      status: { $in: blockingStatuses },
      assignedDriverId: { $exists: true, $ne: null },
    };

    // Exclude specific reservation if provided
    if (excludeReservationId) {
      matchStage.reservationId = { $ne: excludeReservationId };
    }

    return [
      // 1. Match reservations with blocking statuses that have drivers
      { $match: matchStage },

      // 2. Join with reservation_itinerary collection
      {
        $lookup: {
          from: 'reservation_itinerary',
          localField: 'reservationId',
          foreignField: 'reservationId',
          as: 'itinerary',
        },
      },

      // 3. Filter reservations with overlapping dates
      {
        $match: {
          $expr: {
            $and: [
              { $gt: [{ $size: '$itinerary' }, 0] }, // Has itinerary
              {
                $or: [
                  // Check overlap using arrivalTime
                  {
                    $and: [
                      {
                        $lte: [
                          { $min: '$itinerary.arrivalTime' },
                          endDate,
                        ],
                      },
                      {
                        $gte: [
                          { $max: '$itinerary.arrivalTime' },
                          startDate,
                        ],
                      },
                    ],
                  },
                  // Check overlap using departureTime (if exists)
                  {
                    $and: [
                      {
                        $lte: [
                          {
                            $min: {
                              $filter: {
                                input: '$itinerary.departureTime',
                                as: 'dep',
                                cond: { $ne: ['$$dep', null] },
                              },
                            },
                          },
                          endDate,
                        ],
                      },
                      {
                        $gte: [
                          {
                            $max: {
                              $filter: {
                                input: '$itinerary.departureTime',
                                as: 'dep',
                                cond: { $ne: ['$$dep', null] },
                              },
                            },
                          },
                          startDate,
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        },
      },

      // 4. Group by assignedDriverId to get unique driver IDs
      {
        $group: {
          _id: '$assignedDriverId',
        },
      },

      // 5. Project just the driver ID
      {
        $project: {
          _id: 1,
        },
      },
    ];
  }
}

