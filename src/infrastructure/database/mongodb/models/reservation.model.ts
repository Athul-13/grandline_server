import mongoose, { Document } from 'mongoose';
import { ReservationStatus, TripType } from '../../../../shared/constants';
import { ReservationSchema } from '../schemas/reservation.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * Selected vehicle structure
 */
export interface ISelectedVehicle {
  vehicleId: string;
  quantity: number;
}

/**
 * Route data structure
 */
export interface IRouteData {
  outbound?: {
    totalDistance?: number;
    totalDuration?: number;
    routeGeometry?: string;
  };
  return?: {
    totalDistance?: number;
    totalDuration?: number;
    routeGeometry?: string;
  };
}

/**
 * Original pricing snapshot structure
 */
export interface IOriginalPricing {
  total?: number;
  currency?: string;
  paidAt?: Date;
}

/**
 * MongoDB document type for Reservation
 * Represents the structure of a document in the reservations collection
 */
export interface IReservationModel extends Document {
  reservationId: string;
  userId: string;
  quoteId: string;
  paymentId: string;
  reservationNumber?: string;
  tripType: TripType;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  status: ReservationStatus;
  selectedVehicles?: ISelectedVehicle[];
  selectedAmenities?: string[];
  routeData?: IRouteData;
  assignedDriverId?: string;
  originalDriverId?: string;
  originalPricing?: IOriginalPricing;
  reservationDate: Date;
  confirmedAt?: Date;
  driverChangedAt?: Date;
  refundStatus?: 'none' | 'partial' | 'full';
  refundedAmount?: number;
  refundedAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  driverReport?: {
    content: string;
    submittedAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Reservation
 */
export const ReservationDB = mongoose.model<IReservationModel>('Reservation', ReservationSchema);

/**
 * Creates an IDatabaseModel instance for Reservation
 */
export function createReservationModel(): IDatabaseModel<IReservationModel> {
  return new MongoDBModelImpl<IReservationModel>(ReservationDB);
}

