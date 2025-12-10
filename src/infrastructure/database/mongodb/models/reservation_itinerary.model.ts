import mongoose, { Document } from 'mongoose';
import { StopType } from '../../../../shared/constants';
import { ReservationItinerarySchema } from '../schemas/reservation_itinerary.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for ReservationItinerary
 * Represents the structure of a document in the reservation_itinerary collection
 */
export interface IReservationItineraryModel extends Document {
  itineraryId: string;
  reservationId: string;
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
 * Mongoose model instance for ReservationItinerary
 */
export const ReservationItineraryDB = mongoose.model<IReservationItineraryModel>(
  'ReservationItinerary',
  ReservationItinerarySchema
);

/**
 * Creates an IDatabaseModel instance for ReservationItinerary
 */
export function createReservationItineraryModel(): IDatabaseModel<IReservationItineraryModel> {
  return new MongoDBModelImpl<IReservationItineraryModel>(ReservationItineraryDB);
}

