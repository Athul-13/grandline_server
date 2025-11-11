import { StopType } from '../../shared/constants';

/**
 * QuoteItinerary domain entity representing an itinerary stop in a quote
 * Contains core business logic and validation rules
 */
export class QuoteItinerary {
  constructor(
    public readonly itineraryId: string,
    public readonly quoteId: string,
    public readonly tripType: 'outbound' | 'return',
    public readonly stopOrder: number,
    public readonly locationName: string,
    public readonly latitude: number,
    public readonly longitude: number,
    public readonly arrivalTime: Date,
    public readonly stopType: StopType,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly departureTime?: Date,
    public readonly isDriverStaying: boolean = false,
    public readonly stayingDuration?: number
  ) {}

  /**
   * Checks if this is a pickup location
   */
  isPickup(): boolean {
    return this.stopType === StopType.PICKUP;
  }

  /**
   * Checks if this is a dropoff location
   */
  isDropoff(): boolean {
    return this.stopType === StopType.DROPOFF;
  }

  /**
   * Checks if this is an intermediate stop
   */
  isStop(): boolean {
    return this.stopType === StopType.STOP;
  }

  /**
   * Checks if this is an outbound trip stop
   */
  isOutbound(): boolean {
    return this.tripType === 'outbound';
  }

  /**
   * Checks if this is a return trip stop
   */
  isReturn(): boolean {
    return this.tripType === 'return';
  }

  /**
   * Checks if driver is staying at this location for 1 day or more
   */
  hasExtendedStay(): boolean {
    return this.isDriverStaying && !!this.stayingDuration && this.stayingDuration >= 24;
  }

  /**
   * Checks if departure time is set
   */
  hasDepartureTime(): boolean {
    return !!this.departureTime;
  }
}

