/**
 * PricingConfig domain entity representing a pricing configuration version
 * Contains core business logic and validation rules
 */
export class PricingConfig {
  constructor(
    public readonly pricingConfigId: string,
    public readonly version: number,
    public readonly fuelPrice: number,
    public readonly averageDriverPerHourRate: number,
    public readonly stayingChargePerDay: number,
    public readonly taxPercentage: number,
    public readonly nightChargePerNight: number,
    public readonly isActive: boolean,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  /**
   * Checks if this pricing config is active
   */
  isActiveConfig(): boolean {
    return this.isActive;
  }

  /**
   * Checks if the tax percentage is valid (0-100)
   */
  hasValidTaxPercentage(): boolean {
    return this.taxPercentage >= 0 && this.taxPercentage <= 100;
  }

  /**
   * Checks if all pricing values are positive
   */
  hasValidPrices(): boolean {
    return (
      this.fuelPrice >= 0 &&
      this.averageDriverPerHourRate >= 0 &&
      this.stayingChargePerDay >= 0 &&
      this.nightChargePerNight >= 0
    );
  }
}

