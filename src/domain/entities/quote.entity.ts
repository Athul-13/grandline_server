import { QuoteStatus, TripType } from '../../shared/constants';

/**
 * Selected vehicle structure
 */
export interface ISelectedVehicle {
  vehicleId: string;
  quantity: number;
}

/**
 * Pricing breakdown structure
 */
export interface IPricingBreakdown {
  fuelPriceAtTime?: number;
  averageDriverRateAtTime?: number;
  taxPercentageAtTime?: number;
  baseFare?: number;
  distanceFare?: number;
  driverCharge?: number;
  fuelMaintenance?: number;
  nightCharge?: number;
  amenitiesTotal?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
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
 * Quote domain entity representing a quote in the bus rental system
 * Contains core business logic and validation rules
 */
export class Quote {
  constructor(
    public readonly quoteId: string,
    public readonly userId: string,
    public readonly quoteNumber: string,
    public readonly tripType: TripType,
    public readonly status: QuoteStatus,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly tripName?: string,
    public readonly eventType?: string,
    public readonly customEventType?: string,
    public readonly passengerCount?: number,
    public readonly currentStep?: number,
    public readonly selectedVehicles?: ISelectedVehicle[],
    public readonly selectedAmenities?: string[],
    public readonly pricing?: IPricingBreakdown,
    public readonly routeData?: IRouteData,
    public readonly assignedDriverId?: string,
    public readonly actualDriverRate?: number,
    public readonly pricingLastUpdatedAt?: Date,
    public readonly quotedAt?: Date,
    public readonly isDeleted: boolean = false
  ) {}

  /**
   * Checks if the quote is a draft
   */
  isDraft(): boolean {
    return this.status === QuoteStatus.DRAFT;
  }

  /**
   * Checks if the quote has been submitted
   */
  isSubmitted(): boolean {
    return this.status === QuoteStatus.SUBMITTED;
  }

  /**
   * Checks if the quote has been paid
   */
  isPaid(): boolean {
    return this.status === QuoteStatus.PAID;
  }

  /**
   * Checks if the quote can be edited
   * EXPIRED quotes cannot be edited (user must resubmit)
   */
  canBeEdited(): boolean {
    return (this.status === QuoteStatus.DRAFT || this.status === QuoteStatus.SUBMITTED)
  }

  /**
   * Checks if the quote can be deleted
   */
  canBeDeleted(): boolean {
    return this.isDraft() && !this.isDeleted;
  }

  /**
   * Checks if the quote is a one-way trip
   */
  isOneWay(): boolean {
    return this.tripType === TripType.ONE_WAY;
  }

  /**
   * Checks if the quote is a two-way (return) trip
   */
  isTwoWay(): boolean {
    return this.tripType === TripType.TWO_WAY;
  }

  /**
   * Checks if pricing has been calculated
   */
  hasPricing(): boolean {
    return !!this.pricing && !!this.pricing.total;
  }

  /**
   * Checks if the quote is complete (all steps done)
   */
  isComplete(): boolean {
    return this.currentStep === 5;
  }

  /**
   * Checks if the quote has been quoted (driver assigned)
   */
  isQuoted(): boolean {
    return this.status === QuoteStatus.QUOTED;
  }

  /**
   * Checks if the quote has expired
   */
  isExpired(): boolean {
    return this.status === QuoteStatus.EXPIRED;
  }

  /**
   * Checks if the quote payment window has expired (24 hours)
   */
  isPaymentWindowExpired(): boolean {
    if (!this.quotedAt) {
      return false;
    }
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.quotedAt < twentyFourHoursAgo;
  }

  /**
   * Checks if the quote is within payment window (24 hours)
   */
  isWithinPaymentWindow(): boolean {
    return this.isQuoted() && !this.isPaymentWindowExpired();
  }
}

