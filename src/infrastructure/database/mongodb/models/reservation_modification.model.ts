import mongoose, { Document } from 'mongoose';
import { ReservationModificationSchema } from '../schemas/reservation_modification.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for ReservationModification
 * Represents the structure of a document in the reservation_modifications collection
 */
export interface IReservationModificationModel extends Document {
  modificationId: string;
  reservationId: string;
  modifiedBy: string;
  modificationType: 'driver_change' | 'passenger_add' | 'vehicle_adjust' | 'status_change' | 'charge_add' | 'other';
  description: string;
  previousValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for ReservationModification
 */
export const ReservationModificationDB = mongoose.model<IReservationModificationModel>(
  'ReservationModification',
  ReservationModificationSchema
);

/**
 * Creates an IDatabaseModel instance for ReservationModification
 */
export function createReservationModificationModel(): IDatabaseModel<IReservationModificationModel> {
  return new MongoDBModelImpl<IReservationModificationModel>(ReservationModificationDB);
}

