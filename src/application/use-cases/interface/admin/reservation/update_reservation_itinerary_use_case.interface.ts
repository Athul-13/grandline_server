import { Reservation } from '../../../../../domain/entities/reservation.entity';

/**
 * Itinerary stop update data
 */
export interface ItineraryStopUpdateData {
  itineraryId?: string; // If provided, update existing stop; if not, create new stop
  tripType: 'outbound' | 'return';
  stopOrder: number;
  locationName: string;
  latitude: number;
  longitude: number;
  arrivalTime: Date;
  departureTime?: Date;
  stopType: string;
  isDriverStaying: boolean;
  stayingDuration?: number;
}

/**
 * Interface for updating reservation itinerary use case
 */
export interface IUpdateReservationItineraryUseCase {
  execute(
    reservationId: string,
    stops: ItineraryStopUpdateData[],
    adminUserId: string
  ): Promise<Reservation>;
}

