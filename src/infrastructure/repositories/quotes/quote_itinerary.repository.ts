import { injectable } from 'tsyringe';
import { IQuoteItineraryRepository } from '../../../domain/repositories/quote_itinerary_repository.interface';
import { QuoteItinerary } from '../../../domain/entities/quote_itinerary.entity';
import {
  IQuoteItineraryModel,
  createQuoteItineraryModel,
} from '../../database/mongodb/models/quote_itinerary.model';
import { QuoteItineraryRepositoryMapper } from '../../mappers/quote_itinerary_repository.mapper';
import { MongoBaseRepository } from '../base/mongo_base.repository';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

/**
 * QuoteItinerary repository implementation
 * Handles data persistence operations for QuoteItinerary entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class QuoteItineraryRepositoryImpl
  extends MongoBaseRepository<IQuoteItineraryModel, QuoteItinerary>
  implements IQuoteItineraryRepository {
  private readonly itineraryModel: IDatabaseModel<IQuoteItineraryModel>;

  constructor() {
    const model = createQuoteItineraryModel();
    super(model, 'itineraryId');
    this.itineraryModel = model;
  }

  protected toEntity(doc: IQuoteItineraryModel): QuoteItinerary {
    return QuoteItineraryRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: QuoteItinerary): Partial<IQuoteItineraryModel> {
    return {
      itineraryId: entity.itineraryId,
      quoteId: entity.quoteId,
      tripType: entity.tripType,
      stopOrder: entity.stopOrder,
      locationName: entity.locationName,
      latitude: entity.latitude,
      longitude: entity.longitude,
      arrivalTime: entity.arrivalTime,
      departureTime: entity.departureTime,
      isDriverStaying: entity.isDriverStaying,
      stayingDuration: entity.stayingDuration,
      stopType: entity.stopType,
    };
  }

  async findByQuoteId(quoteId: string): Promise<QuoteItinerary[]> {
    const docs = await this.itineraryModel.find({ quoteId });
    return QuoteItineraryRepositoryMapper.toEntities(docs);
  }

  async findByQuoteIdAndTripType(
    quoteId: string,
    tripType: 'outbound' | 'return'
  ): Promise<QuoteItinerary[]> {
    const docs = await this.itineraryModel.find({ quoteId, tripType });
    return QuoteItineraryRepositoryMapper.toEntities(docs);
  }

  async deleteByQuoteId(quoteId: string): Promise<void> {
    await this.itineraryModel.deleteMany({ quoteId });
  }

  async deleteByQuoteIdAndTripType(
    quoteId: string,
    tripType: 'outbound' | 'return'
  ): Promise<void> {
    await this.itineraryModel.deleteMany({ quoteId, tripType });
  }

  async findByQuoteIdOrdered(quoteId: string): Promise<QuoteItinerary[]> {
    const docs = await this.itineraryModel.find({ quoteId }, { sort: { stopOrder: 1 } });
    return QuoteItineraryRepositoryMapper.toEntities(docs);
  }
}

