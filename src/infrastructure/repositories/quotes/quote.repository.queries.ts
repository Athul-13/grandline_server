import { QuoteStatus } from '../../../shared/constants';
import { DateRange } from '../../../application/dtos/dashboard.dto';

/**
 * Query builders for Quote Repository
 * Handles: Basic filters, Admin queries, Vehicle/Driver availability checks
 * 
 * ORGANIZATION:
 * - Basic Query Builders: Date range filters, admin filters
 * - Vehicle Availability: Complex aggregation pipelines for finding booked/reserved vehicles
 * - Driver Availability: Complex aggregation pipeline for finding booked drivers
 */
export class QuoteQueryBuilder {
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
   * Builds admin filter with statuses and userIds
   * @param params Filter parameters
   * @returns MongoDB filter object for admin queries
   */
  static buildAdminFilter(params: {
    includeDeleted: boolean;
    statuses?: QuoteStatus[];
    userIds?: string[];
  }): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    // Handle deleted filter
    if (!params.includeDeleted) {
      filter.isDeleted = false;
    }

    // Handle status filter
    if (params.statuses && params.statuses.length > 0) {
      filter.status = { $in: params.statuses };
    }

    // Handle user IDs filter
    if (params.userIds && params.userIds.length > 0) {
      filter.userId = { $in: params.userIds };
    }

    return filter;
  }

  /**
   * Builds base filter with isDeleted check
   */
  static buildBaseFilter(includeDeleted: boolean = false): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    if (!includeDeleted) {
      filter.isDeleted = false;
    }
    return filter;
  }

  /**
   * Builds aggregation pipeline to find booked vehicle IDs in date range
   * Uses complex aggregation with lookup to check itinerary overlaps
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param excludeQuoteId Optional quote ID to exclude from results
   * @returns MongoDB aggregation pipeline
   */
  static buildBookedVehicleIdsPipeline(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Record<string, unknown>[] {
    // Statuses that block vehicle availability
    const blockingStatuses = [
      QuoteStatus.PAID,
      QuoteStatus.ACCEPTED,
      QuoteStatus.QUOTED,
      QuoteStatus.NEGOTIATING,
    ];

    const matchStage: Record<string, unknown> = {
      status: { $in: blockingStatuses },
      isDeleted: false,
      'selectedVehicles.0': { $exists: true }, // Has at least one vehicle
    };

    // Exclude specific quote if provided
    if (excludeQuoteId) {
      matchStage.quoteId = { $ne: excludeQuoteId };
    }

    return [
      // 1. Match quotes with blocking statuses that have vehicles
      { $match: matchStage },

      // 2. Join with itinerary collection
      {
        $lookup: {
          from: 'quote_itinerary',
          localField: 'quoteId',
          foreignField: 'quoteId',
          as: 'itinerary',
        },
      },

      // 3. Filter quotes with overlapping dates
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

      // 4. Unwind selectedVehicles array
      { $unwind: '$selectedVehicles' },

      // 5. Group by vehicleId to get unique vehicle IDs
      {
        $group: {
          _id: '$selectedVehicles.vehicleId',
        },
      },

      // 6. Project just the vehicle ID
      {
        $project: {
          _id: 1,
        },
      },
    ];
  }

  /**
   * Builds aggregation pipeline to find booked driver IDs in date range
   * Excludes expired QUOTED quotes (more than 24 hours old)
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param excludeQuoteId Optional quote ID to exclude from results
   * @returns MongoDB aggregation pipeline
   */
  static buildBookedDriverIdsPipeline(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Record<string, unknown>[] {
    // Statuses that block driver availability
    const blockingStatuses = [
      QuoteStatus.PAID,
      QuoteStatus.ACCEPTED,
      QuoteStatus.QUOTED,
      QuoteStatus.NEGOTIATING,
    ];

    // Calculate 24 hours ago for QUOTED status expiration check
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const matchStage: Record<string, unknown> = {
      status: { $in: blockingStatuses },
      isDeleted: false,
      assignedDriverId: { $exists: true, $ne: null },
      // For QUOTED status, only block if within 24-hour payment window
      // For other statuses, always block
      $or: [
        { status: { $ne: QuoteStatus.QUOTED } },
        {
          status: QuoteStatus.QUOTED,
          quotedAt: { $gte: twentyFourHoursAgo },
        },
      ],
    };

    // Exclude specific quote if provided
    if (excludeQuoteId) {
      matchStage.quoteId = { $ne: excludeQuoteId };
    }

    return [
      // 1. Match quotes with blocking statuses that have assigned drivers
      { $match: matchStage },

      // 2. Join with itinerary collection
      {
        $lookup: {
          from: 'quote_itinerary',
          localField: 'quoteId',
          foreignField: 'quoteId',
          as: 'itinerary',
        },
      },

      // 3. Filter quotes with overlapping dates
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

      // 4. Group by driverId to get unique driver IDs
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

  /**
   * Builds aggregation pipeline to find reserved vehicle IDs in date range
   * Only includes DRAFT quotes created within the last 30 minutes
   * @param startDate Start date of the range
   * @param endDate End date of the range
   * @param excludeQuoteId Optional quote ID to exclude from results
   * @returns MongoDB aggregation pipeline
   */
  static buildReservedVehicleIdsPipeline(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Record<string, unknown>[] {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const matchStage: Record<string, unknown> = {
      status: QuoteStatus.DRAFT,
      isDeleted: false,
      'selectedVehicles.0': { $exists: true },
      createdAt: { $gte: thirtyMinutesAgo }, // Only recent DRAFT quotes
    };

    // Exclude specific quote if provided
    if (excludeQuoteId) {
      matchStage.quoteId = { $ne: excludeQuoteId };
    }

    return [
      // 1. Match recent DRAFT quotes with vehicles
      { $match: matchStage },

      // 2. Join with itinerary collection
      {
        $lookup: {
          from: 'quote_itinerary',
          localField: 'quoteId',
          foreignField: 'quoteId',
          as: 'itinerary',
        },
      },

      // 3. Filter quotes with overlapping dates
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

      // 4. Unwind selectedVehicles array
      { $unwind: '$selectedVehicles' },

      // 5. Group by vehicleId to get unique vehicle IDs
      {
        $group: {
          _id: '$selectedVehicles.vehicleId',
        },
      },

      // 6. Project just the vehicle ID
      {
        $project: {
          _id: 1,
        },
      },
    ];
  }
}

