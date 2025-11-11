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
}

