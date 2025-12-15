import { injectable } from 'tsyringe';
import { IQuoteRepository } from '../../domain/repositories/quote_repository.interface';
import { Quote } from '../../domain/entities/quote.entity';
import { IQuoteModel, createQuoteModel } from '../database/mongodb/models/quote.model';
import { QuoteRepositoryMapper } from '../mappers/quote_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { QuoteStatus, TripType } from '../../shared/constants';
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
 * Quote repository implementation
 * Handles data persistence operations for Quote entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class QuoteRepositoryImpl
  extends MongoBaseRepository<IQuoteModel, Quote>
  implements IQuoteRepository {
  private readonly quoteModel: IDatabaseModel<IQuoteModel>;

  constructor() {
    const model = createQuoteModel();
    super(model, 'quoteId');
    this.quoteModel = model;
  }

  protected toEntity(doc: IQuoteModel): Quote {
    return QuoteRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Quote): Partial<IQuoteModel> {
    return {
      quoteId: entity.quoteId,
      userId: entity.userId,
      tripType: entity.tripType,
      tripName: entity.tripName,
      eventType: entity.eventType,
      customEventType: entity.customEventType,
      passengerCount: entity.passengerCount,
      status: entity.status,
      currentStep: entity.currentStep,
      selectedVehicles: entity.selectedVehicles,
      selectedAmenities: entity.selectedAmenities,
      pricing: entity.pricing,
      routeData: entity.routeData,
      assignedDriverId: entity.assignedDriverId,
      actualDriverRate: entity.actualDriverRate,
      pricingLastUpdatedAt: entity.pricingLastUpdatedAt,
      quotedAt: entity.quotedAt,
      isDeleted: entity.isDeleted,
    };
  }

  async findByUserId(userId: string): Promise<Quote[]> {
    const docs = await this.quoteModel.find({ userId, isDeleted: false });
    return QuoteRepositoryMapper.toEntities(docs);
  }

  async findByStatus(status: QuoteStatus): Promise<Quote[]> {
    const docs = await this.quoteModel.find({ status, isDeleted: false });
    return QuoteRepositoryMapper.toEntities(docs);
  }

  async findByUserIdAndStatus(userId: string, status: QuoteStatus): Promise<Quote[]> {
    const docs = await this.quoteModel.find({ userId, status, isDeleted: false });
    return QuoteRepositoryMapper.toEntities(docs);
  }

  async findActiveQuotesByUserId(userId: string): Promise<Quote[]> {
    const docs = await this.quoteModel.find({ userId, isDeleted: false });
    return QuoteRepositoryMapper.toEntities(docs);
  }

  async findAllQuotesByUserId(userId: string): Promise<Quote[]> {
    const docs = await this.quoteModel.find({ userId });
    return QuoteRepositoryMapper.toEntities(docs);
  }

  async softDelete(quoteId: string): Promise<void> {
    await this.quoteModel.updateOne({ quoteId }, { $set: { isDeleted: true } });
  }

  async findByTripType(tripType: TripType): Promise<Quote[]> {
    const docs = await this.quoteModel.find({ tripType, isDeleted: false });
    return QuoteRepositoryMapper.toEntities(docs);
  }

  async findAllForAdmin(
    includeDeleted: boolean,
    statuses?: QuoteStatus[],
    userIds?: string[]
  ): Promise<Quote[]> {
    const filter: Record<string, unknown> = {};

    // Handle deleted filter
    if (!includeDeleted) {
      filter.isDeleted = false;
    }

    // Handle status filter
    if (statuses && statuses.length > 0) {
      filter.status = { $in: statuses };
    }

    // Handle user IDs filter
    if (userIds && userIds.length > 0) {
      filter.userId = { $in: userIds };
    }

    const docs = await this.quoteModel.find(filter);
    return QuoteRepositoryMapper.toEntities(docs);
  }

  /**
   * Finds vehicle IDs that are booked during the specified date range
   * Uses MongoDB aggregation pipeline for efficient querying
   */
  async findBookedVehicleIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Promise<Set<string>> {
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

    // Exclude specific quote if provided (useful when updating existing quote)
    if (excludeQuoteId) {
      matchStage.quoteId = { $ne: excludeQuoteId };
    }

    const pipeline = [
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

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{ _id: string }>;
    return new Set<string>(result.map((r: { _id: string }) => r._id));
  }

  /**
   * Finds driver IDs that are booked during the specified date range
   * Uses MongoDB aggregation pipeline for efficient querying
   * Excludes expired QUOTED quotes (more than 24 hours old)
   */
  async findBookedDriverIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Promise<Set<string>> {
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

    const pipeline = [
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

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{ _id: string }>;
    return new Set<string>(result.map((r: { _id: string }) => r._id));
  }

  /**
   * Finds vehicle IDs that are temporarily reserved in DRAFT quotes
   * Only includes DRAFT quotes created within the last 30 minutes
   */
  async findReservedVehicleIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeQuoteId?: string
  ): Promise<Set<string>> {
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

    const pipeline = [
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

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{ _id: string }>;
    return new Set<string>(result.map((r: { _id: string }) => r._id));
  }

  async getCountsByStatus(timeRange?: DateRange): Promise<Map<QuoteStatus, number>> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.createdAt = dateFilter;
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ];

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{ _id: QuoteStatus; count: number }>;
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

  async getRevenueMetrics(timeRange?: DateRange): Promise<RevenueMetrics> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      status: QuoteStatus.PAID,
      'pricing.total': { $exists: true, $ne: null },
    };

    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.createdAt = dateFilter;
    }

    const pipeline = [
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

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{
      totalRevenue: number;
      averageValue: number;
      minValue: number;
      maxValue: number;
    }>;

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

  async getConversionRates(timeRange?: DateRange): Promise<QuoteConversionRates> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.createdAt = dateFilter;
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          draft: { $sum: { $cond: [{ $eq: ['$status', QuoteStatus.DRAFT] }, 1, 0] } },
          submitted: { $sum: { $cond: [{ $eq: ['$status', QuoteStatus.SUBMITTED] }, 1, 0] } },
          quoted: { $sum: { $cond: [{ $eq: ['$status', QuoteStatus.QUOTED] }, 1, 0] } },
          paid: { $sum: { $cond: [{ $eq: ['$status', QuoteStatus.PAID] }, 1, 0] } },
        },
      },
    ];

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{
      draft: number;
      submitted: number;
      quoted: number;
      paid: number;
    }>;

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

  async getTimeBasedTrends(timeRange: DateRange, granularity: 'day' | 'week' | 'month'): Promise<TimeTrend[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (timeRange.startDate || timeRange.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.createdAt = dateFilter;
    }

    let dateFormat: string;
    switch (granularity) {
      case 'day':
        dateFormat = '%Y-%m-%d';
        break;
      case 'week':
        dateFormat = '%Y-%U'; // Year-Week
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const pipeline = [
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
                { $and: [{ $eq: ['$status', QuoteStatus.PAID] }, { $ne: ['$pricing.total', null] }] },
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

    const result = (await this.quoteModel.aggregate(pipeline)) as TimeTrend[];
    return result;
  }

  getGeographicAnalytics(_timeRange?: DateRange): Promise<GeographicData[]> {
    // This is a simplified implementation
    // In a real scenario, you'd extract location data from routeData
    // For now, return empty array as geographic data extraction requires route parsing
    return Promise.resolve([]);
  }

  async getVehicleAnalytics(timeRange?: DateRange): Promise<VehicleAnalytics[]> {
    const filter: Record<string, unknown> = {
      isDeleted: false,
      'selectedVehicles.0': { $exists: true },
    };

    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.createdAt = dateFilter;
    }

    const pipeline = [
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
                { $and: [{ $eq: ['$status', QuoteStatus.PAID] }, { $ne: ['$pricing.total', null] }] },
                {
                  $cond: [
                    { $gt: ['$totalVehiclesCount', 0] },
                    { $multiply: ['$pricing.total', { $divide: ['$selectedVehicles.quantity', '$totalVehiclesCount'] }] },
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

    const result = (await this.quoteModel.aggregate(pipeline)) as VehicleAnalytics[];
    return result;
  }

  async getUserAnalytics(timeRange?: DateRange): Promise<UserAnalytics[]> {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.createdAt = dateFilter;
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: '$userId',
          quoteCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$status', QuoteStatus.PAID] }, { $ne: ['$pricing.total', null] }] },
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

    const result = (await this.quoteModel.aggregate(pipeline)) as UserAnalytics[];
    return result;
  }
}

