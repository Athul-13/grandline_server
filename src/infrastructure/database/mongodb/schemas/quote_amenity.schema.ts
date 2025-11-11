import { Schema } from 'mongoose';

/**
 * MongoDB schema for QuoteAmenity collection
 */
export const QuoteAmenitySchema: Schema = new Schema(
  {
    quoteAmenityId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    quoteId: {
      type: String,
      required: true,
      index: true,
    },
    amenityId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'quote_amenities',
  }
);

// Add indexes
QuoteAmenitySchema.index({ quoteAmenityId: 1 });
QuoteAmenitySchema.index({ quoteId: 1 });
QuoteAmenitySchema.index({ amenityId: 1 });
QuoteAmenitySchema.index({ quoteId: 1, amenityId: 1 }, { unique: true });
QuoteAmenitySchema.index({ createdAt: -1 });

