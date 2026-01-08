import { Quote } from '../../../domain/entities/quote.entity';
import { QuoteStatus, TripType } from '../../../shared/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test fixture factory for Quote entity
 * Provides helper functions to create Quote instances for testing
 */

interface QuoteFixtureOptions {
  quoteId?: string;
  userId?: string;
  quoteNumber?: string;
  tripType?: TripType;
  status?: QuoteStatus;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  currentStep?: number;
  selectedVehicles?: Array<{ vehicleId: string; quantity: number }>;
  selectedAmenities?: string[];
  pricing?: {
    total?: number;
    subtotal?: number;
    tax?: number;
    [key: string]: unknown;
  };
  routeData?: {
    outbound?: { totalDistance?: number; totalDuration?: number; routeGeometry?: string };
    return?: { totalDistance?: number; totalDuration?: number; routeGeometry?: string };
  };
  assignedDriverId?: string;
  actualDriverRate?: number;
  pricingLastUpdatedAt?: Date;
  quotedAt?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a Quote fixture with default values
 * Override specific properties as needed for your test
 */
export function createQuoteFixture(options: QuoteFixtureOptions = {}): Quote {
  const now = new Date();
  const quoteId = options.quoteId || uuidv4();
  const userId = options.userId || uuidv4();
  const quoteNumber = options.quoteNumber || uuidv4();

  return new Quote(
    quoteId,
    userId,
    quoteNumber,
    options.tripType || TripType.ONE_WAY,
    options.status || QuoteStatus.DRAFT,
    options.createdAt || now,
    options.updatedAt || now,
    options.tripName,
    options.eventType,
    options.customEventType,
    options.passengerCount,
    options.currentStep,
    options.selectedVehicles,
    options.selectedAmenities,
    options.pricing,
    options.routeData,
    options.assignedDriverId,
    options.actualDriverRate,
    options.pricingLastUpdatedAt,
    options.quotedAt,
    options.isDeleted || false
  );
}

/**
 * Creates a Quote fixture in DRAFT status
 */
export function createDraftQuoteFixture(options: Omit<QuoteFixtureOptions, 'status'> = {}): Quote {
  return createQuoteFixture({ ...options, status: QuoteStatus.DRAFT });
}

/**
 * Creates a Quote fixture in QUOTED status (ready for payment)
 */
export function createQuotedQuoteFixture(
  options: Omit<QuoteFixtureOptions, 'status' | 'quotedAt'> & { quotedAt?: Date } = {}
): Quote {
  return createQuoteFixture({
    ...options,
    status: QuoteStatus.QUOTED,
    quotedAt: options.quotedAt || new Date(),
    pricing: options.pricing || { total: 10000 },
  });
}

/**
 * Creates a Quote fixture in SUBMITTED status
 */
export function createSubmittedQuoteFixture(options: Omit<QuoteFixtureOptions, 'status'> = {}): Quote {
  return createQuoteFixture({ ...options, status: QuoteStatus.SUBMITTED });
}

/**
 * Creates a Quote fixture with pricing information
 */
export function createQuoteWithPricingFixture(
  total: number,
  options: Omit<QuoteFixtureOptions, 'pricing'> = {}
): Quote {
  return createQuoteFixture({
    ...options,
    pricing: {
      total,
      subtotal: total * 0.9,
      tax: total * 0.1,
    },
  });
}

