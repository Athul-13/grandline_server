import { injectable } from 'tsyringe';
import { IQuoteRepository } from '../../../domain/repositories/quote_repository.interface';
import { Quote } from '../../../domain/entities/quote.entity';
import { IQuoteModel, createQuoteModel } from '../../database/mongodb/models/quote.model';
import { QuoteRepositoryMapper } from '../../mappers/quote_repository.mapper';
import { MongoBaseRepository } from '../base/mongo_base.repository';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';
import { QuoteStatus, TripType } from '../../../shared/constants';
import {
  DateRange,
  RevenueMetrics,
  QuoteConversionRates,
  TimeTrend,
  GeographicData,
  VehicleAnalytics,
  UserAnalytics,
} from '../../../application/dtos/dashboard.dto';
import { QuoteQueryBuilder } from './quote.repository.queries';
import { QuoteAnalyticsBuilder } from './quote.repository.analytics';

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
    const filter = QuoteQueryBuilder.buildAdminFilter({
      includeDeleted,
      statuses,
      userIds,
    });

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
    const pipeline = QuoteQueryBuilder.buildBookedVehicleIdsPipeline(
      startDate,
      endDate,
      excludeQuoteId
    );

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
    const pipeline = QuoteQueryBuilder.buildBookedDriverIdsPipeline(
      startDate,
      endDate,
      excludeQuoteId
    );

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
    const pipeline = QuoteQueryBuilder.buildReservedVehicleIdsPipeline(
      startDate,
      endDate,
      excludeQuoteId
    );

    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{ _id: string }>;
    return new Set<string>(result.map((r: { _id: string }) => r._id));
  }

  async getCountsByStatus(timeRange?: DateRange): Promise<Map<QuoteStatus, number>> {
    const filter = {
      isDeleted: false,
      ...QuoteQueryBuilder.buildDateRangeFilter(timeRange),
    };
    const pipeline = QuoteAnalyticsBuilder.buildCountsByStatusPipeline(filter);
    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{
      _id: QuoteStatus;
      count: number;
    }>;
    return QuoteAnalyticsBuilder.aggregateCountsByStatus(result);
  }

  async getRevenueMetrics(timeRange?: DateRange): Promise<RevenueMetrics> {
    const filter = QuoteAnalyticsBuilder.buildRevenueFilter(timeRange);
    const pipeline = QuoteAnalyticsBuilder.buildRevenuePipeline(filter);
    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{
      totalRevenue: number;
      averageValue: number;
      minValue: number;
      maxValue: number;
    }>;
    return QuoteAnalyticsBuilder.aggregateRevenueMetrics(result);
  }

  async getConversionRates(timeRange?: DateRange): Promise<QuoteConversionRates> {
    const filter = {
      isDeleted: false,
      ...QuoteQueryBuilder.buildDateRangeFilter(timeRange),
    };
    const pipeline = QuoteAnalyticsBuilder.buildConversionPipeline(filter);
    const result = (await this.quoteModel.aggregate(pipeline)) as Array<{
      draft: number;
      submitted: number;
      quoted: number;
      paid: number;
    }>;
    return QuoteAnalyticsBuilder.aggregateConversionRates(result);
  }

  async getTimeBasedTrends(timeRange: DateRange, granularity: 'day' | 'week' | 'month'): Promise<TimeTrend[]> {
    const pipeline = QuoteAnalyticsBuilder.buildTimeTrendPipeline(timeRange, granularity);
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
    const filter = QuoteAnalyticsBuilder.buildVehicleFilter(timeRange);
    const pipeline = QuoteAnalyticsBuilder.buildVehiclePipeline(filter);
    const result = (await this.quoteModel.aggregate(pipeline)) as VehicleAnalytics[];
    return result;
  }

  async getUserAnalytics(timeRange?: DateRange): Promise<UserAnalytics[]> {
    const filter = {
      isDeleted: false,
      ...QuoteQueryBuilder.buildDateRangeFilter(timeRange),
    };
    const pipeline = QuoteAnalyticsBuilder.buildUserPipeline(filter);
    const result = (await this.quoteModel.aggregate(pipeline)) as UserAnalytics[];
    return result;
  }
}

