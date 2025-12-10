import { ReservationStatus, TripType } from '../../shared/constants';

/**
 * Selected vehicle structure
 */
export interface ISelectedVehicle {
  vehicleId: string;
  quantity: number;
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
 * Original pricing snapshot (what was paid at time of reservation)
 */
export interface IOriginalPricing {
  total?: number;
  currency?: string;
  paidAt?: Date;
}

/**
 * Reservation domain entity representing a reservation in the bus rental system
 * Contains core business logic and validation rules
 */
export class Reservation {
  constructor(
    public readonly reservationId: string,
    public readonly userId: string,
    public readonly quoteId: string,
    public readonly paymentId: string,
    public readonly tripType: TripType,
    public readonly status: ReservationStatus,
    public readonly reservationDate: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly tripName?: string,
    public readonly eventType?: string,
    public readonly customEventType?: string,
    public readonly passengerCount?: number,
    public readonly selectedVehicles?: ISelectedVehicle[],
    public readonly selectedAmenities?: string[],
    public readonly routeData?: IRouteData,
    public readonly assignedDriverId?: string,
    public readonly originalDriverId?: string,
    public readonly originalPricing?: IOriginalPricing,
    public readonly confirmedAt?: Date,
    public readonly driverChangedAt?: Date,
    public readonly refundStatus?: 'none' | 'partial' | 'full',
    public readonly refundedAmount?: number,
    public readonly refundedAt?: Date,
    public readonly cancellationReason?: string,
    public readonly cancelledAt?: Date
  ) {}

  /**
   * Checks if the reservation is confirmed
   */
  isConfirmed(): boolean {
    return this.status === ReservationStatus.CONFIRMED;
  }

  /**
   * Checks if the reservation has been modified
   */
  isModified(): boolean {
    return this.status === ReservationStatus.MODIFIED;
  }

  /**
   * Checks if the reservation is cancelled
   */
  isCancelled(): boolean {
    return this.status === ReservationStatus.CANCELLED;
  }

  /**
   * Checks if the reservation is completed
   */
  isCompleted(): boolean {
    return this.status === ReservationStatus.COMPLETED;
  }

  /**
   * Checks if the reservation is refunded
   */
  isRefunded(): boolean {
    return this.status === ReservationStatus.REFUNDED;
  }

  /**
   * Checks if the reservation is a one-way trip
   */
  isOneWay(): boolean {
    return this.tripType === TripType.ONE_WAY;
  }

  /**
   * Checks if the reservation is a two-way (return) trip
   */
  isTwoWay(): boolean {
    return this.tripType === TripType.TWO_WAY;
  }

  /**
   * Checks if the driver has been changed
   */
  hasDriverChanged(): boolean {
    return !!this.driverChangedAt && this.assignedDriverId !== this.originalDriverId;
  }

  /**
   * Checks if the reservation has been refunded
   */
  hasRefund(): boolean {
    return this.refundStatus === 'partial' || this.refundStatus === 'full';
  }

  /**
   * Checks if the reservation can be modified
   */
  canBeModified(): boolean {
    return !this.isCancelled() && !this.isCompleted() && !this.isRefunded();
  }
}

