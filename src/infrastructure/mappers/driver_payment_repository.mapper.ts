import { DriverPayment } from "../../domain/entities/driver_payment.entity";
import { IDriverPaymentModel } from "../database/mongodb/models/driver_payment.model";

export class DriverPaymentRepositoryMapper {
    static toEntity(doc: IDriverPaymentModel): DriverPayment {
        return new DriverPayment(
            doc.paymentId,
            doc.driverId,
            doc.reservationId,
            doc.amount,
            doc.createdAt || null,
            doc.updatedAt || null
        );
    }

    static toEntities(docs: IDriverPaymentModel[]): DriverPayment[] {
        return docs.map(doc => this.toEntity(doc));
    }
}