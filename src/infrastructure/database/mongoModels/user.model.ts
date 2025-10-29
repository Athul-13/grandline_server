import mongoose, { Document } from 'mongoose';
import { UserRole, UserStatus } from '../../../shared/constants';
import { UserSchema } from '../mongoSchemas/user.schema';

/**
 * MongoDB document type for User
 * Represents the structure of a document in the users collection
 */
export interface IUserModel extends Document {
  userId: string;
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  role: UserRole;
  status: UserStatus;
  profilePicture: string;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserDB = mongoose.model<IUserModel>('User', UserSchema);