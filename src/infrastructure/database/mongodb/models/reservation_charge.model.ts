import mongoose, { Document } from 'mongoose';
import { ReservationChargeSchema } from '../schemas/reservation_charge.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for ReservationCharge
 * Represents the structure of a document in the reservation_charges collection
 */
export interface IReservationChargeModel extends Document {
  chargeId: string;
  reservationId: string;
  chargeType: 'additional_passenger' | 'vehicle_upgrade' | 'amenity_add' | 'late_fee' | 'other';
  description: string;
  amount: number;
  currency: string;
  addedBy: string;
  isPaid: boolean;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for ReservationCharge
 */
export const ReservationChargeDB = mongoose.model<IReservationChargeModel>(
  'ReservationCharge',
  ReservationChargeSchema
);

/**
 * Creates an IDatabaseModel instance for ReservationCharge
 */
export function createReservationChargeModel(): IDatabaseModel<IReservationChargeModel> {
  return new MongoDBModelImpl<IReservationChargeModel>(ReservationChargeDB);
}

