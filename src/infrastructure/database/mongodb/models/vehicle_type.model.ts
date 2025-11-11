import mongoose, { Document } from 'mongoose';
import { VehicleTypeSchema } from '../schemas/vehicle_type.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for VehicleType
 * Represents the structure of a document in the vehicle_types collection
 */
export interface IVehicleTypeModel extends Document {
  vehicleTypeId: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for VehicleType
 */
export const VehicleTypeDB = mongoose.model<IVehicleTypeModel>('VehicleType', VehicleTypeSchema);

/**
 * Creates an IDatabaseModel instance for VehicleType
 */
export function createVehicleTypeModel(): IDatabaseModel<IVehicleTypeModel> {
  return new MongoDBModelImpl<IVehicleTypeModel>(VehicleTypeDB);
}