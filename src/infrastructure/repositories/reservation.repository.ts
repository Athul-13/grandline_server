import { injectable } from 'tsyringe';
import { IReservationRepository } from '../../domain/repositories/reservation_repository.interface';
import { Reservation } from '../../domain/entities/reservation.entity';
import {
  IReservationModel,
  createReservationModel,
} from '../database/mongodb/models/reservation.model';
import { ReservationRepositoryMapper } from '../mappers/reservation_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { ReservationStatus } from '../../shared/constants';
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
 * Reservation repository implementation
 * Handles data persistence operations for Reservation entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class ReservationRepositoryImpl
  extends MongoBaseRepository<IReservationModel, Reservation>
  implements IReservationRepository {
  private readonly reservationModel: IDatabaseModel<IReservationModel>;

  constructor() {
    const model = createReservationModel();
    super(model, 'reservationId');
    this.reservationModel = model;
  }

  protected toEntity(doc: IReservationModel): Reservation {
    return ReservationRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Reservation): Partial<IReservationModel> {
    return {
      reservationId: entity.reservationId,
      userId: entity.userId,
      quoteId: entity.quoteId,
      paymentId: entity.paymentId,
      tripType: entity.tripType,
      tripName: entity.tripName,
      eventType: entity.eventType,
      customEventType: entity.customEventType,
      passengerCount: entity.passengerCount,
      status: entity.status,
      selectedVehicles: entity.selectedVehicles,
      selectedAmenities: entity.selectedAmenities,
      routeData: entity.routeData,
      assignedDriverId: entity.assignedDriverId,
      originalDriverId: entity.originalDriverId,
      originalPricing: entity.originalPricing,
      reservationDate: entity.reservationDate,
      confirmedAt: entity.confirmedAt,
      driverChangedAt: entity.driverChangedAt,
      refundStatus: entity.refundStatus,
      refundedAmount: entity.refundedAmount,
      refundedAt: entity.refundedAt,
      cancellationReason: entity.cancellationReason,
      cancelledAt: entity.cancelledAt,
    };
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ reservations: Reservation[]; total: number }> {
    const skip = (page - 1) * limit;
    const allDocs = await this.reservationModel.find(
      { userId },
      { sort: { createdAt: -1 } }
    );
    const total = allDocs.length;
    const paginatedDocs = allDocs.slice(skip, skip + limit);
    return {
      reservations: ReservationRepositoryMapper.toEntities(paginatedDocs),
      total,
    };
  }

  async findByQuoteId(quoteId: string): Promise<Reservation | null> {
    const doc = await this.reservationModel.findOne({ quoteId });
    return doc ? this.toEntity(doc) : null;
  }

  async findByPaymentId(paymentId: string): Promise<Reservation | null> {
    const doc = await this.reservationModel.findOne({ paymentId });
    return doc ? this.toEntity(doc) : null;
  }

  async findByStatus(status: ReservationStatus): Promise<Reservation[]> {
    const docs = await this.reservationModel.find({ status });
    return ReservationRepositoryMapper.toEntities(docs);
  }

  async findByUserIdAndStatus(
    userId: string,
    status: ReservationStatus
  ): Promise<Reservation[]> {
    const docs = await this.reservationModel.find({ userId, status });
    return ReservationRepositoryMapper.toEntities(docs);
  }

  async findAllForAdmin(
    page: number,
    limit: number,
    _includeDeleted: boolean = false,
    statuses?: ReservationStatus[],
    userIds?: string[],
    searchQuery?: string
  ): Promise<{ reservations: Reservation[]; total: number }> {
    const filter: Record<string, unknown> = {};

    // Handle status filter
    if (statuses && statuses.length > 0) {
      filter.status = { $in: statuses };
    }

    // Handle user IDs filter
    if (userIds && userIds.length > 0) {
      filter.userId = { $in: userIds };
    }

    // Handle search query
    if (searchQuery && searchQuery.trim().length > 0) {
      filter.$or = [
        { reservationId: { $regex: searchQuery, $options: 'i' } },
        { tripName: { $regex: searchQuery, $options: 'i' } },
      ];
    }

    const allDocs = await this.reservationModel.find(filter, {
      sort: { createdAt: -1 },
    });
    const total = allDocs.length;
    const skip = (page - 1) * limit;
    const paginatedDocs = allDocs.slice(skip, skip + limit);

    return {
      reservations: ReservationRepositoryMapper.toEntities(paginatedDocs),
      total,
    };
  }

  async findBookedDriverIdsInDateRange(
    startDate: Date,
    endDate: Date,
    excludeReservationId?: string
  ): Promise<Set<string>> {
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

    const pipeline = [
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

    const result = (await this.reservationModel.aggregate(
      pipeline
    )) as Array<{ _id: string }>;
    return new Set<string>(result.map((r: { _id: string }) => r._id));
  }

  async getCountsByStatus(timeRange?: DateRange): Promise<Map<ReservationStatus, number>> {
    const filter: Record<string, unknown> = {};

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

    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      _id: ReservationStatus;
      count: number;
    }>;
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

  async getRevenueMetrics(timeRange?: DateRange): Promise<RevenueMetrics> {
    const filter: Record<string, unknown> = {
      'originalPricing.total': { $exists: true, $ne: null },
      status: { $ne: ReservationStatus.CANCELLED },
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
          totalRevenue: { $sum: '$originalPricing.total' },
          averageValue: { $avg: '$originalPricing.total' },
          minValue: { $min: '$originalPricing.total' },
          maxValue: { $max: '$originalPricing.total' },
        },
      },
    ];

    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
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

  async getConversionRates(timeRange?: DateRange): Promise<ReservationConversionRates> {
    const filter: Record<string, unknown> = {};

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

    // Get total quotes count (need to join with quotes collection)
    // For now, we'll calculate based on reservations only
    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          confirmed: { $sum: { $cond: [{ $eq: ['$status', ReservationStatus.CONFIRMED] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', ReservationStatus.COMPLETED] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', ReservationStatus.CANCELLED] }, 1, 0] } },
          total: { $sum: 1 },
        },
      },
    ];

    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      confirmed: number;
      completed: number;
      cancelled: number;
      total: number;
    }>;

    if (result.length === 0) {
      return {
        quoteToReservation: 0,
        confirmedToCompleted: 0,
        cancellationRate: 0,
      };
    }

    const data = result[0];
    // Note: quoteToReservation would need quote count, simplified here
    const confirmedToCompleted = data.confirmed > 0 ? (data.completed / data.confirmed) * 100 : 0;
    const cancellationRate = data.total > 0 ? (data.cancelled / data.total) * 100 : 0;

    return {
      quoteToReservation: 0, // Would need quote count to calculate properly
      confirmedToCompleted,
      cancellationRate,
    };
  }

  async getTimeBasedTrends(timeRange: DateRange, granularity: 'day' | 'week' | 'month'): Promise<TimeTrend[]> {
    const filter: Record<string, unknown> = {};

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
        dateFormat = '%Y-%U';
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
                { $and: [{ $ne: ['$originalPricing.total', null] }, { $ne: ['$status', ReservationStatus.CANCELLED] }] },
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

    const result = (await this.reservationModel.aggregate(pipeline)) as TimeTrend[];
    return result;
  }

  getGeographicAnalytics(_timeRange?: DateRange): Promise<GeographicData[]> {
    // Simplified implementation - would need route parsing
    return Promise.resolve([]);
  }

  async getVehicleAnalytics(timeRange?: DateRange): Promise<VehicleAnalytics[]> {
    const filter: Record<string, unknown> = {
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
                { $and: [{ $ne: ['$originalPricing.total', null] }, { $ne: ['$status', ReservationStatus.CANCELLED] }] },
                {
                  $cond: [
                    { $gt: ['$totalVehiclesCount', 0] },
                    { $multiply: ['$originalPricing.total', { $divide: ['$selectedVehicles.quantity', '$totalVehiclesCount'] }] },
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

    const result = (await this.reservationModel.aggregate(pipeline)) as VehicleAnalytics[];
    return result;
  }

  async getUserAnalytics(timeRange?: DateRange): Promise<UserAnalytics[]> {
    const filter: Record<string, unknown> = {};

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
          reservationCount: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$originalPricing.total', null] }, { $ne: ['$status', ReservationStatus.CANCELLED] }] },
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

    const result = (await this.reservationModel.aggregate(pipeline)) as UserAnalytics[];
    return result;
  }

  async getRefundAnalytics(timeRange?: DateRange): Promise<RefundAnalytics> {
    const filter: Record<string, unknown> = {
      refundStatus: { $ne: 'none' },
    };

    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      filter.refundedAt = dateFilter;
    }

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRefunded: { $sum: '$refundedAmount' },
          averageRefundAmount: { $avg: '$refundedAmount' },
          partial: { $sum: { $cond: [{ $eq: ['$refundStatus', 'partial'] }, 1, 0] } },
          full: { $sum: { $cond: [{ $eq: ['$refundStatus', 'full'] }, 1, 0] } },
          totalRefunds: { $sum: 1 },
        },
      },
    ];

    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      totalRefunded: number;
      averageRefundAmount: number;
      partial: number;
      full: number;
      totalRefunds: number;
    }>;

    // Get total reservations for refund rate calculation
    const totalFilter: Record<string, unknown> = {};
    if (timeRange?.startDate || timeRange?.endDate) {
      const dateFilter: Record<string, unknown> = {};
      if (timeRange.startDate) {
        dateFilter.$gte = timeRange.startDate;
      }
      if (timeRange.endDate) {
        dateFilter.$lte = timeRange.endDate;
      }
      totalFilter.createdAt = dateFilter;
    }
    const allDocs = await this.reservationModel.find(totalFilter);
    const totalReservations = allDocs.length;

    if (result.length === 0) {
      return {
        totalRefunded: 0,
        refundRate: 0,
        refundsByStatus: {},
        averageRefundAmount: 0,
      };
    }

    const data = result[0];
    const refundRate = totalReservations > 0 ? (data.totalRefunds / totalReservations) * 100 : 0;

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

