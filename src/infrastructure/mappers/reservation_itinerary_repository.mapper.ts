import { ReservationItinerary } from '../../domain/entities/reservation_itinerary.entity';
import { IReservationItineraryModel } from '../database/mongodb/models/reservation_itinerary.model';

/**
 * Repository mapper for ReservationItinerary entity
 * Converts MongoDB documents to domain entities
 */
export class ReservationItineraryRepositoryMapper {
  static toEntity(doc: IReservationItineraryModel): ReservationItinerary {
    return new ReservationItinerary(
      doc.itineraryId,
      doc.reservationId,
      doc.tripType,
      doc.stopOrder,
      doc.locationName,
      doc.latitude,
      doc.longitude,
      doc.arrivalTime,
      doc.stopType,
      doc.createdAt,
      doc.updatedAt,
      doc.departureTime,
      doc.isDriverStaying,
      doc.stayingDuration
    );
  }

  static toEntities(docs: IReservationItineraryModel[]): ReservationItinerary[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

