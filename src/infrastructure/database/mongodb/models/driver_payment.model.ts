import mongoose, { Document } from "mongoose";
import { DriverPaymentSchema } from "../schemas/driver_payment.schema";
import { IDatabaseModel } from "../../../../domain/services/mongodb_model.interface";
import { MongoDBModelImpl } from "../mongodb_model.impl";

/**
 * MongoDB document type for DriverPayment
 * Represents the structure of a document in the driver_payments collection
 */
export interface IDriverPaymentModel extends Document {
    paymentId: string;
    driverId: string;
    reservationId: string;
    amount: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Mongoose model instance for DriverPayment
 */
export const DriverPaymentDB = mongoose.model<IDriverPaymentModel>('DriverPayment', DriverPaymentSchema);

/**
 * Creates an IDatabaseModel instance for DriverPayment
 */
export function createDriverPaymentModel(): IDatabaseModel<IDriverPaymentModel> {
    return new MongoDBModelImpl<IDriverPaymentModel>(DriverPaymentDB);
}