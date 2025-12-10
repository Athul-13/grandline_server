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
}

