import mongoose, { Document } from 'mongoose';
import { NotificationType } from '../../../../shared/constants';
import { NotificationSchema } from '../schemas/notification.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for Notification
 * Represents the structure of a document in the notifications collection
 */
export interface INotificationModel extends Document {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Notification
 */
export const NotificationDB = mongoose.model<INotificationModel>(
  'Notification',
  NotificationSchema
);

/**
 * Creates an IDatabaseModel instance for Notification
 */
export function createNotificationModel(): IDatabaseModel<INotificationModel> {
  return new MongoDBModelImpl<INotificationModel>(NotificationDB);
}

