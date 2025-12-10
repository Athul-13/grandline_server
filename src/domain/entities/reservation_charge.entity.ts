/**
 * ReservationCharge domain entity representing an additional charge for a reservation
 * Tracks extra charges added after initial payment
 */
export class ReservationCharge {
  constructor(
    public readonly chargeId: string,
    public readonly reservationId: string,
    public readonly chargeType: 'additional_passenger' | 'vehicle_upgrade' | 'amenity_add' | 'late_fee' | 'other',
    public readonly description: string,
    public readonly amount: number,
    public readonly currency: string = 'INR',
    public readonly addedBy: string, // Admin user ID
    public readonly isPaid: boolean = false,
    public readonly paidAt?: Date,
    public readonly createdAt: Date = new Date()
  ) {}

  /**
   * Checks if the charge is paid
   */
  isPaidCharge(): boolean {
    return this.isPaid;
  }

  /**
   * Checks if the charge is pending payment
   */
  isPending(): boolean {
    return !this.isPaid;
  }

  /**
   * Checks if this is an additional passenger charge
   */
  isAdditionalPassenger(): boolean {
    return this.chargeType === 'additional_passenger';
  }

  /**
   * Checks if this is a vehicle upgrade charge
   */
  isVehicleUpgrade(): boolean {
    return this.chargeType === 'vehicle_upgrade';
  }

  /**
   * Checks if this is an amenity addition charge
   */
  isAmenityAdd(): boolean {
    return this.chargeType === 'amenity_add';
  }
}

