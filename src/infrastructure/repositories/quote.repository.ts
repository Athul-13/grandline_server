import { injectable } from 'tsyringe';
import { IQuoteRepository } from '../../domain/repositories/quote_repository.interface';
import { Quote } from '../../domain/entities/quote.entity';
import { IQuoteModel, createQuoteModel } from '../database/mongodb/models/quote.model';
import { QuoteRepositoryMapper } from '../mappers/quote_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { QuoteStatus, TripType } from '../../shared/constants';

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
}

