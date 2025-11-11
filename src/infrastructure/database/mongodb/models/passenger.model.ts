import mongoose, { Document } from 'mongoose';
import { PassengerSchema } from '../schemas/passenger.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for Passenger
 * Represents the structure of a document in the passengers collection
 */
export interface IPassengerModel extends Document {
  passengerId: string;
  quoteId?: string;
  reservationId?: string;
  fullName: string;
  phoneNumber: string;
  age: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Passenger
 */
export const PassengerDB = mongoose.model<IPassengerModel>('Passenger', PassengerSchema);

/**
 * Creates an IDatabaseModel instance for Passenger
 */
export function createPassengerModel(): IDatabaseModel<IPassengerModel> {
  return new MongoDBModelImpl<IPassengerModel>(PassengerDB);
}

