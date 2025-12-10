import { ReservationModification } from '../../domain/entities/reservation_modification.entity';
import { IReservationModificationModel } from '../database/mongodb/models/reservation_modification.model';

/**
 * Repository mapper for ReservationModification entity
 * Converts MongoDB documents to domain entities
 */
export class ReservationModificationRepositoryMapper {
  static toEntity(doc: IReservationModificationModel): ReservationModification {
    return new ReservationModification(
      doc.modificationId,
      doc.reservationId,
      doc.modifiedBy,
      doc.modificationType,
      doc.description,
      doc.previousValue,
      doc.newValue,
      doc.metadata,
      doc.createdAt
    );
  }

  static toEntities(docs: IReservationModificationModel[]): ReservationModification[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

