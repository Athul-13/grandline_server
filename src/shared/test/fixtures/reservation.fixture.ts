import { Reservation } from '../../../domain/entities/reservation.entity';
import { ReservationStatus, TripType } from '../../../shared/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test fixture factory for Reservation entity
 * Provides helper functions to create Reservation instances for testing
 */

interface ReservationFixtureOptions {
  reservationId?: string;
  userId?: string;
  quoteId?: string;
  paymentId?: string;
  tripType?: TripType;
  status?: ReservationStatus;
  tripName?: string;
  eventType?: string;
  customEventType?: string;
  passengerCount?: number;
  selectedVehicles?: Array<{ vehicleId: string; quantity: number }>;
  selectedAmenities?: string[];
  assignedDriverId?: string;
  originalDriverId?: string;
  originalPricing?: { total?: number; currency?: string; paidAt?: Date };
  confirmedAt?: Date;
  driverChangedAt?: Date;
  refundStatus?: 'none' | 'partial' | 'full';
  refundedAmount?: number;
  refundedAt?: Date;
  cancellationReason?: string;
  cancelledAt?: Date;
  reservationDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a Reservation fixture with default values
 * Override specific properties as needed for your test
 */
export function createReservationFixture(options: ReservationFixtureOptions = {}): Reservation {
  const now = new Date();
  const reservationId = options.reservationId || uuidv4();
  const userId = options.userId || uuidv4();
  const quoteId = options.quoteId || uuidv4();
  const paymentId = options.paymentId || uuidv4();

  return new Reservation(
    reservationId,
    userId,
    quoteId,
    paymentId,
    options.tripType || TripType.ONE_WAY,
    options.status || ReservationStatus.CONFIRMED,
    options.reservationDate || now,
    options.createdAt || now,
    options.updatedAt || now,
    options.tripName,
    options.eventType,
    options.customEventType,
    options.passengerCount,
    options.selectedVehicles,
    options.selectedAmenities,
    undefined, // routeData
    options.assignedDriverId,
    options.originalDriverId,
    options.originalPricing,
    options.confirmedAt,
    options.driverChangedAt,
    options.refundStatus || 'none',
    options.refundedAmount,
    options.refundedAt,
    options.cancellationReason,
    options.cancelledAt
  );
}

/**
 * Creates a Reservation fixture in CONFIRMED status
 */
export function createConfirmedReservationFixture(
  options: Omit<ReservationFixtureOptions, 'status'> = {}
): Reservation {
  return createReservationFixture({ ...options, status: ReservationStatus.CONFIRMED });
}

/**
 * Creates a Reservation fixture in CANCELLED status
 */
export function createCancelledReservationFixture(
  options: Omit<ReservationFixtureOptions, 'status' | 'cancelledAt'> & { cancelledAt?: Date } = {}
): Reservation {
  return createReservationFixture({
    ...options,
    status: ReservationStatus.CANCELLED,
    cancelledAt: options.cancelledAt || new Date(),
  });
}

/**
 * Creates a Reservation fixture with refund status
 */
export function createRefundedReservationFixture(
  options: Omit<ReservationFixtureOptions, 'status' | 'refundStatus' | 'refundedAmount' | 'refundedAt'> & {
    refundStatus?: 'partial' | 'full';
    refundedAmount?: number;
    refundedAt?: Date;
  } = {}
): Reservation {
  return createReservationFixture({
    ...options,
    status: options.refundStatus === 'full' ? ReservationStatus.REFUNDED : ReservationStatus.CONFIRMED,
    refundStatus: options.refundStatus || 'partial',
    refundedAmount: options.refundedAmount || 0,
    refundedAt: options.refundedAt || new Date(),
  });
}

