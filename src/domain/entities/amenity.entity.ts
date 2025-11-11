/**
 * Amenity domain entity representing an amenity in the bus rental system
 * Contains core business logic and validation rules
 */
export class Amenity {
  constructor(
    public readonly amenityId: string,
    public readonly name: string,
    public readonly price: number | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Checks if the amenity is free (no price)
   */
  isFree(): boolean {
    return this.price === null || this.price === 0;
  }

  /**
   * Gets the price of the amenity, defaulting to 0 if null
   * Useful for price calculations
   */
  getPrice(): number {
    return this.price ?? 0;
  }
}

