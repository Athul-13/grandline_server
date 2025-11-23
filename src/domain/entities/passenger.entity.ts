/**
 * Passenger domain entity representing a passenger in a quote or reservation
 * Contains core business logic and validation rules
 */
export class Passenger {
  constructor(
    public readonly passengerId: string,
    public readonly fullName: string,
    public readonly phoneNumber: string,
    public readonly age: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly quoteId?: string,
    public readonly reservationId?: string
  ) {}

  /**
   * Checks if the passenger is associated with a quote
   */
  isInQuote(): boolean {
    return !!this.quoteId;
  }

  /**
   * Checks if the passenger is associated with a reservation
   */
  isInReservation(): boolean {
    return !!this.reservationId;
  }

  /**
   * Checks if the passenger is an adult (18+)
   */
  isAdult(): boolean {
    return this.age >= 18;
  }

  /**
   * Checks if the passenger is a child (under 18)
   */
  isChild(): boolean {
    return this.age < 18;
  }

  /**
   * Checks if the passenger is a senior (65+)
   */
  isSenior(): boolean {
    return this.age >= 65;
  }
}

