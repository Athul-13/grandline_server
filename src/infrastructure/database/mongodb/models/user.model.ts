import mongoose, { Document } from 'mongoose';
import { UserRole, UserStatus } from '../../../../shared/constants';
import { UserSchema } from '../schemas/user.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for User
 * Represents the structure of a document in the users collection
 */
export interface IUserModel extends Document {
  userId: string;
  fullName: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  googleId?: string;
  role: UserRole;
  status: UserStatus;
  profilePicture: string;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for User
 */
export const UserDB = mongoose.model<IUserModel>('User', UserSchema);

/**
 * Creates an IDatabaseModel instance for User
 */
export function createUserModel(): IDatabaseModel<IUserModel> {
  return new MongoDBModelImpl<IUserModel>(UserDB);
}