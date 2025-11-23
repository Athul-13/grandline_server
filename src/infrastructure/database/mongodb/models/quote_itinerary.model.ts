import mongoose, { Document } from 'mongoose';
import { StopType } from '../../../../shared/constants';
import { QuoteItinerarySchema } from '../schemas/quote_itinerary.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for QuoteItinerary
 * Represents the structure of a document in the quote_itinerary collection
 */
export interface IQuoteItineraryModel extends Document {
  itineraryId: string;
  quoteId: string;
  tripType: 'outbound' | 'return';
  stopOrder: number;
  locationName: string;
  latitude: number;
  longitude: number;
  arrivalTime: Date;
  departureTime?: Date;
  isDriverStaying: boolean;
  stayingDuration?: number;
  stopType: StopType;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for QuoteItinerary
 */
export const QuoteItineraryDB = mongoose.model<IQuoteItineraryModel>(
  'QuoteItinerary',
  QuoteItinerarySchema
);

/**
 * Creates an IDatabaseModel instance for QuoteItinerary
 */
export function createQuoteItineraryModel(): IDatabaseModel<IQuoteItineraryModel> {
  return new MongoDBModelImpl<IQuoteItineraryModel>(QuoteItineraryDB);
}

