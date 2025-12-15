import mongoose, { Document } from 'mongoose';
import { DriverFcmTokenSchema } from '../schemas/driver_fcm_token.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for DriverFcmToken
 */
export interface IDriverFcmTokenModel extends Document {
  tokenId: string;
  driverId: string;
  fcmToken: string;
  deviceId?: string;
  platform: 'ios' | 'android';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for DriverFcmToken
 */
export const DriverFcmTokenDB = mongoose.model<IDriverFcmTokenModel>('DriverFcmToken', DriverFcmTokenSchema);

/**
 * Creates an IDatabaseModel instance for DriverFcmToken
 */
export function createDriverFcmTokenModel(): IDatabaseModel<IDriverFcmTokenModel> {
  return new MongoDBModelImpl<IDriverFcmTokenModel>(DriverFcmTokenDB);
}

