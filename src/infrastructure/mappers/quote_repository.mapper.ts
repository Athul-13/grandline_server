import { Quote } from '../../domain/entities/quote.entity';
import { IQuoteModel } from '../database/mongodb/models/quote.model';

/**
 * Repository mapper for Quote entity
 * Converts MongoDB documents to domain entities
 */
export class QuoteRepositoryMapper {
  static toEntity(doc: IQuoteModel): Quote {
    return new Quote(
      doc.quoteId,
      doc.userId,
      doc.tripType,
      doc.status,
      doc.createdAt,
      doc.updatedAt,
      doc.tripName,
      doc.eventType,
      doc.customEventType,
      doc.passengerCount,
      doc.currentStep,
      doc.selectedVehicles,
      doc.selectedAmenities,
      doc.pricing,
      doc.routeData,
      doc.isDeleted
    );
  }

  static toEntities(docs: IQuoteModel[]): Quote[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

