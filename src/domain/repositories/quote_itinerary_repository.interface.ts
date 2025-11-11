import { QuoteItinerary } from '../entities/quote_itinerary.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for QuoteItinerary entity operations
 * Defines the contract for data access layer implementations
 */
export interface IQuoteItineraryRepository extends IBaseRepository<QuoteItinerary> {
  /**
   * Finds all itinerary stops for a quote
   */
  findByQuoteId(quoteId: string): Promise<QuoteItinerary[]>;

  /**
   * Finds itinerary stops by quote ID and trip type
   */
  findByQuoteIdAndTripType(
    quoteId: string,
    tripType: 'outbound' | 'return'
  ): Promise<QuoteItinerary[]>;

  /**
   * Deletes all itinerary stops for a quote
   */
  deleteByQuoteId(quoteId: string): Promise<void>;

  /**
   * Deletes itinerary stops by quote ID and trip type
   */
  deleteByQuoteIdAndTripType(
    quoteId: string,
    tripType: 'outbound' | 'return'
  ): Promise<void>;

  /**
   * Finds itinerary stops ordered by stopOrder
   */
  findByQuoteIdOrdered(quoteId: string): Promise<QuoteItinerary[]>;
}

