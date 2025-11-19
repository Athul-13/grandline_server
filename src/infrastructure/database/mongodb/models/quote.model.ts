import mongoose, { Document } from 'mongoose';
import { QuoteStatus, TripType } from '../../../../shared/constants';
import { QuoteSchema } from '../schemas/quote.schema';
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
 * Pricing breakdown structure
 */
export interface IPricingBreakdown {
  fuelPriceAtTime?: number;
  averageDriverRateAtTime?: number;
  taxPercentageAtTime?: number;
  baseFare?: number;
  distanceFare?: number;
  driverCharge?: number;
  fuelMaintenance?: number;
  nightCharge?: number;
  amenitiesTotal?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
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
 * MongoDB document type for Quote
 * Represents the structure of a document in the quotes collection
 */
export interface IQuoteModel extends Document {
  quoteId: string;
  userId: string;
  tripType: TripType;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  status: QuoteStatus;
  currentStep?: number;
  selectedVehicles?: ISelectedVehicle[];
  selectedAmenities?: string[];
  pricing?: IPricingBreakdown;
  routeData?: IRouteData;
  assignedDriverId?: string;
  actualDriverRate?: number;
  pricingLastUpdatedAt?: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose model instance for Quote
 */
export const QuoteDB = mongoose.model<IQuoteModel>('Quote', QuoteSchema);

/**
 * Creates an IDatabaseModel instance for Quote
 */
export function createQuoteModel(): IDatabaseModel<IQuoteModel> {
  return new MongoDBModelImpl<IQuoteModel>(QuoteDB);
}

