import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';
import { IQuoteItineraryModel } from '../database/mongodb/models/quote_itinerary.model';

/**
 * Repository mapper for QuoteItinerary entity
 * Converts MongoDB documents to domain entities
 */
export class QuoteItineraryRepositoryMapper {
  static toEntity(doc: IQuoteItineraryModel): QuoteItinerary {
    return new QuoteItinerary(
      doc.itineraryId,
      doc.quoteId,
      doc.tripType,
      doc.stopOrder,
      doc.locationName,
      doc.latitude,
      doc.longitude,
      doc.arrivalTime,
      doc.stopType,
      doc.createdAt,
      doc.updatedAt,
      doc.departureTime,
      doc.isDriverStaying,
      doc.stayingDuration
    );
  }

  static toEntities(docs: IQuoteItineraryModel[]): QuoteItinerary[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

