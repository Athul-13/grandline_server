import { Reservation } from '../../domain/entities/reservation.entity';
import { IReservationModel } from '../database/mongodb/models/reservation.model';

/**
 * Repository mapper for Reservation entity
 * Converts MongoDB documents to domain entities
 */
export class ReservationRepositoryMapper {
  static toEntity(doc: IReservationModel): Reservation {
    return new Reservation(
      doc.reservationId,
      doc.userId,
      doc.quoteId,
      doc.paymentId,
      doc.tripType,
      doc.status,
      doc.reservationDate,
      doc.createdAt,
      doc.updatedAt,
      doc.tripName,
      doc.eventType,
      doc.customEventType,
      doc.passengerCount,
      doc.selectedVehicles,
      doc.selectedAmenities,
      doc.routeData,
      doc.assignedDriverId,
      doc.originalDriverId,
      doc.originalPricing,
      doc.confirmedAt,
      doc.driverChangedAt,
      doc.refundStatus,
      doc.refundedAmount,
      doc.refundedAt,
      doc.cancellationReason,
      doc.cancelledAt
    );
  }

  static toEntities(docs: IReservationModel[]): Reservation[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

