import mongoose, { Document } from 'mongoose';
import { AmenitySchema } from '../schemas/amenity.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for Amenity
 * Represents the structure of a document in the amenities collection
 */
export interface IAmenityModel extends Document {
  amenityId: string;
  name: string;
  price: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Amenity
 */
export const AmenityDB = mongoose.model<IAmenityModel>('Amenity', AmenitySchema);

/**
 * Creates an IDatabaseModel instance for Amenity
 */
export function createAmenityModel(): IDatabaseModel<IAmenityModel> {
  return new MongoDBModelImpl<IAmenityModel>(AmenityDB);
}

