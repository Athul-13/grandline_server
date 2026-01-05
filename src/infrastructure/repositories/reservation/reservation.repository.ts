import { injectable } from 'tsyringe';
import { IReservationRepository } from '../../../domain/repositories/reservation_repository.interface';
import { Reservation } from '../../../domain/entities/reservation.entity';
import {
  IReservationModel,
  createReservationModel,
} from '../../database/mongodb/models/reservation.model';
import { ReservationRepositoryMapper } from '../../mappers/reservation_repository.mapper';
import { MongoBaseRepository } from '../base/mongo_base.repository';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';
import { ReservationStatus } from '../../../shared/constants';
import {
  DateRange,
  RevenueMetrics,
  ReservationConversionRates,
  TimeTrend,
  GeographicData,
  VehicleAnalytics,
  UserAnalytics,
  RefundAnalytics,
} from '../../../application/dtos/dashboard.dto';
import { ReservationQueryBuilder } from './reservation.repository.queries';
import { ReservationAnalyticsBuilder } from './reservation.repository.analytics';

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
      reservationNumber: entity.reservationNumber,
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

  async findByReservationNumber(reservationNumber: string): Promise<Reservation[] | null> {
    const docs = await this.reservationModel.find({ reservationNumber });
    return ReservationRepositoryMapper.toEntities(docs);
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

  async findByAssignedDriverId(driverId: string): Promise<Reservation[]> {
    const docs = await this.reservationModel.find(
      { assignedDriverId: driverId },
      { sort: { createdAt: -1 } }
    );
    return ReservationRepositoryMapper.toEntities(docs);
  }

  async findAllForAdmin(
    page: number,
    limit: number,
    _includeDeleted: boolean = false,
    statuses?: ReservationStatus[],
    userIds?: string[],
    searchQuery?: string,
    excludePastTrips: boolean = true
  ): Promise<{ reservations: Reservation[]; total: number }> {
    const filter = ReservationQueryBuilder.buildAdminFilter({
      statuses,
      userIds,
      searchQuery,
      excludePastTrips,
    });

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
    const pipeline = ReservationQueryBuilder.buildDriverAvailabilityPipeline(
      startDate,
      endDate,
      excludeReservationId
    );

    const result = (await this.reservationModel.aggregate(
      pipeline
    )) as Array<{ _id: string }>;
    return new Set<string>(result.map((r: { _id: string }) => r._id));
  }

  async getCountsByStatus(timeRange?: DateRange): Promise<Map<ReservationStatus, number>> {
    const filter = ReservationQueryBuilder.buildDateRangeFilter(timeRange);
    const pipeline = ReservationAnalyticsBuilder.buildCountsByStatusPipeline(filter);
    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      _id: ReservationStatus;
      count: number;
    }>;
    return ReservationAnalyticsBuilder.aggregateCountsByStatus(result);
  }

  async getRevenueMetrics(timeRange?: DateRange): Promise<RevenueMetrics> {
    const filter = ReservationAnalyticsBuilder.buildRevenueFilter(timeRange);
    const pipeline = ReservationAnalyticsBuilder.buildRevenuePipeline(filter);
    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      totalRevenue: number;
      averageValue: number;
      minValue: number;
      maxValue: number;
    }>;
    return ReservationAnalyticsBuilder.aggregateRevenueMetrics(result);
  }

  async getConversionRates(timeRange?: DateRange): Promise<ReservationConversionRates> {
    const filter = ReservationQueryBuilder.buildDateRangeFilter(timeRange);
    const pipeline = ReservationAnalyticsBuilder.buildConversionPipeline(filter);
    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      confirmed: number;
      completed: number;
      cancelled: number;
      total: number;
    }>;
    return ReservationAnalyticsBuilder.aggregateConversionRates(result);
  }

  async getTimeBasedTrends(timeRange: DateRange, granularity: 'day' | 'week' | 'month'): Promise<TimeTrend[]> {
    const pipeline = ReservationAnalyticsBuilder.buildTimeTrendPipeline(timeRange, granularity);
    const result = (await this.reservationModel.aggregate(pipeline)) as TimeTrend[];
    return result;
  }

  getGeographicAnalytics(_timeRange?: DateRange): Promise<GeographicData[]> {
    // Simplified implementation - would need route parsing
    return Promise.resolve([]);
  }

  async getVehicleAnalytics(timeRange?: DateRange): Promise<VehicleAnalytics[]> {
    const filter = ReservationAnalyticsBuilder.buildVehicleFilter(timeRange);
    const pipeline = ReservationAnalyticsBuilder.buildVehiclePipeline(filter);
    const result = (await this.reservationModel.aggregate(pipeline)) as VehicleAnalytics[];
    return result;
  }

  async getUserAnalytics(timeRange?: DateRange): Promise<UserAnalytics[]> {
    const filter = ReservationQueryBuilder.buildDateRangeFilter(timeRange);
    const pipeline = ReservationAnalyticsBuilder.buildUserPipeline(filter);
    const result = (await this.reservationModel.aggregate(pipeline)) as UserAnalytics[];
    return result;
  }

  async getRefundAnalytics(timeRange?: DateRange): Promise<RefundAnalytics> {
    const filter = ReservationAnalyticsBuilder.buildRefundFilter(timeRange);
    const pipeline = ReservationAnalyticsBuilder.buildRefundPipeline(filter);
    const result = (await this.reservationModel.aggregate(pipeline)) as Array<{
      totalRefunded: number;
      averageRefundAmount: number;
      partial: number;
      full: number;
      totalRefunds: number;
    }>;

    // Get total reservations for refund rate calculation
    const totalFilter = ReservationQueryBuilder.buildDateRangeFilter(timeRange);
    const allDocs = await this.reservationModel.find(totalFilter);
    const totalReservations = allDocs.length;

    return ReservationAnalyticsBuilder.aggregateRefundAnalytics(result, totalReservations);
  }

  async findActiveTrips(): Promise<Reservation[]> {
    const docs = await this.reservationModel.find({
      startedAt: { $exists: true, $ne: null },
      completedAt: null,
    });
    return ReservationRepositoryMapper.toEntities(docs);
  }
}

