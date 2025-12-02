import mongoose, { Document } from 'mongoose';
import { DriverStatus } from '../../../../shared/constants';
import { DriverSchema } from '../schemas/driver.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for Driver
 * Represents the structure of a document in the drivers collection
 */
export interface IDriverModel extends Document {
  driverId: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  profilePictureUrl: string;
  licenseNumber: string;
  licenseCardPhotoUrl: string;
  status: DriverStatus;
  salary: number;
  isOnboarded: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Driver
 */
export const DriverDB = mongoose.model<IDriverModel>('Driver', DriverSchema);

/**
 * Creates an IDatabaseModel instance for Driver
 */
export function createDriverModel(): IDatabaseModel<IDriverModel> {
  return new MongoDBModelImpl<IDriverModel>(DriverDB);
}

