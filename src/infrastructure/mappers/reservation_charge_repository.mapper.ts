import { ReservationCharge } from '../../domain/entities/reservation_charge.entity';
import { IReservationChargeModel } from '../database/mongodb/models/reservation_charge.model';

/**
 * Repository mapper for ReservationCharge entity
 * Converts MongoDB documents to domain entities
 */
export class ReservationChargeRepositoryMapper {
  static toEntity(doc: IReservationChargeModel): ReservationCharge {
    return new ReservationCharge(
      doc.chargeId,
      doc.reservationId,
      doc.chargeType,
      doc.description,
      doc.amount,
      doc.currency,
      doc.addedBy,
      doc.isPaid,
      doc.paidAt,
      doc.createdAt
    );
  }

  static toEntities(docs: IReservationChargeModel[]): ReservationCharge[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

