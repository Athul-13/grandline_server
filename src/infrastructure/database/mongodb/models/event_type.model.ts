import mongoose, { Document } from 'mongoose';
import { EventTypeSchema } from '../schemas/event_type.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for EventType
 * Represents the structure of a document in the event_types collection
 */
export interface IEventTypeModel extends Document {
  eventTypeId: string;
  name: string;
  isCustom: boolean;
  createdBy?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for EventType
 */
export const EventTypeDB = mongoose.model<IEventTypeModel>('EventType', EventTypeSchema);

/**
 * Creates an IDatabaseModel instance for EventType
 */
export function createEventTypeModel(): IDatabaseModel<IEventTypeModel> {
  return new MongoDBModelImpl<IEventTypeModel>(EventTypeDB);
}

