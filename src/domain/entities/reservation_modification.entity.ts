/**
 * ReservationModification domain entity representing a modification to a reservation
 * Tracks all changes made by admins to reservations
 */
export class ReservationModification {
  constructor(
    public readonly modificationId: string,
    public readonly reservationId: string,
    public readonly modifiedBy: string, // Admin user ID
    public readonly modificationType: 'driver_change' | 'passenger_add' | 'vehicle_adjust' | 'status_change' | 'charge_add' | 'other',
    public readonly description: string,
    public readonly previousValue?: string,
    public readonly newValue?: string,
    public readonly metadata?: Record<string, unknown>, // Additional data about the modification
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Checks if this is a driver change modification
   */
  isDriverChange(): boolean {
    return this.modificationType === 'driver_change';
  }

  /**
   * Checks if this is a passenger addition modification
   */
  isPassengerAdd(): boolean {
    return this.modificationType === 'passenger_add';
  }

  /**
   * Checks if this is a vehicle adjustment modification
   */
  isVehicleAdjust(): boolean {
    return this.modificationType === 'vehicle_adjust';
  }

  /**
   * Checks if this is a status change modification
   */
  isStatusChange(): boolean {
    return this.modificationType === 'status_change';
  }

  /**
   * Checks if this is a charge addition modification
   */
  isChargeAdd(): boolean {
    return this.modificationType === 'charge_add';
  }
}

