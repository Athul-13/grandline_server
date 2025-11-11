import mongoose, { Document } from 'mongoose';
import { PricingConfigSchema } from '../schemas/pricing_config.schema';
import { IDatabaseModel } from '../../../../domain/services/mongodb_model.interface';
import { MongoDBModelImpl } from '../mongodb_model.impl';

/**
 * MongoDB document type for PricingConfig
 * Represents the structure of a document in the pricing_config collection
 */
export interface IPricingConfigModel extends Document {
  pricingConfigId: string;
  version: number;
  fuelPrice: number;
  averageDriverPerHourRate: number;
  stayingChargePerDay: number;
  taxPercentage: number;
  nightChargePerNight: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for PricingConfig
 */
export const PricingConfigDB = mongoose.model<IPricingConfigModel>(
  'PricingConfig',
  PricingConfigSchema
);

/**
 * Creates an IDatabaseModel instance for PricingConfig
 */
export function createPricingConfigModel(): IDatabaseModel<IPricingConfigModel> {
  return new MongoDBModelImpl<IPricingConfigModel>(PricingConfigDB);
}

