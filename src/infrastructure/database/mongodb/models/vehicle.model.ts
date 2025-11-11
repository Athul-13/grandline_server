import mongoose, { Document } from 'mongoose';
import { VehicleStatus } from '../../../../shared/constants';
import { VehicleSchema } from '../schemas/vehicle.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for Vehicle
 * Represents the structure of a document in the vehicles collection
 */
export interface IVehicleModel extends Document {
  vehicleId: string;
  vehicleTypeId: string;
  capacity: number;
  baseFare: number;
  maintenance: number;
  plateNumber: string;
  vehicleModel: string;
  year: number;
  fuelConsumption: number;
  imageUrls?: string[];
  status: VehicleStatus;
  amenityIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Vehicle
 */
export const VehicleDB = mongoose.model<IVehicleModel>('Vehicle', VehicleSchema);

/**
 * Creates an IDatabaseModel instance for Vehicle
 */
export function createVehicleModel(): IDatabaseModel<IVehicleModel> {
  return new MongoDBModelImpl<IVehicleModel>(VehicleDB);
}