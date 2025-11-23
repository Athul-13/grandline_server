import mongoose, { Document } from 'mongoose';
import { QuoteAmenitySchema } from '../schemas/quote_amenity.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for QuoteAmenity
 * Represents the structure of a document in the quote_amenities collection
 */
export interface IQuoteAmenityModel extends Document {
  quoteAmenityId: string;
  quoteId: string;
  amenityId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for QuoteAmenity
 */
export const QuoteAmenityDB = mongoose.model<IQuoteAmenityModel>(
  'QuoteAmenity',
  QuoteAmenitySchema
);

/**
 * Creates an IDatabaseModel instance for QuoteAmenity
 */
export function createQuoteAmenityModel(): IDatabaseModel<IQuoteAmenityModel> {
  return new MongoDBModelImpl<IQuoteAmenityModel>(QuoteAmenityDB);
}

