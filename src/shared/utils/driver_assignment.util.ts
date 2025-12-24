import { Driver } from '../../domain/entities/driver.entity';
import { DriverStatus, DRIVER_ASSIGNMENT_CONFIG } from '../constants';
import { ReservationItinerary } from '../../domain/entities/reservation_itinerary.entity';
import { QuoteItinerary } from '../../domain/entities/quote_itinerary.entity';

/**
 * Hard blocker statuses - drivers with these statuses can NEVER be assigned
 */
const HARD_BLOCKER_STATUSES = new Set<DriverStatus>([
  DriverStatus.SUSPENDED,
  DriverStatus.BLOCKED,
  DriverStatus.OFFLINE,
]);

/**
 * Interface for assignment eligibility check result
 */
export interface DriverAssignmentEligibility {
  canAssign: boolean;
  reason?: string;
}

/**
 * Determines the earliest trip start time from itinerary
 */
function getEarliestTripStart(itinerary: (ReservationItinerary | QuoteItinerary)[]): Date | null {
  if (!itinerary || itinerary.length === 0) {
    return null;
  }
  const arrivalTimes = itinerary.map((stop) => stop.arrivalTime);
  return new Date(Math.min(...arrivalTimes.map((d) => d.getTime())));
}

/**
 * Checks if a driver can be assigned to a reservation or quote
 * 
 * Rules:
 * 1. Hard Blockers (always reject):
 *    - driver.status ∈ { SUSPENDED, BLOCKED, OFFLINE }
 *    - driver.isOnboarded === false
 * 
 * 2. Time-Scoped Check:
 *    - If trip starts "soon" (within SOON_START_THRESHOLD_MS), driver MUST be AVAILABLE
 * 
 * 3. Planning Check:
 *    - Date-range conflict checking should be done separately by the caller
 *    - This function focuses on driver operational status
 * 
 * @param driver The driver to check
 * @param tripStartAt The earliest trip start time (from itinerary)
 * @param now Current timestamp for "soon-start" calculation
 * @returns Eligibility result with canAssign flag and optional reason
 */
export function canAssignDriver(
  driver: Driver,
  tripStartAt: Date | null,
  now: Date = new Date()
): DriverAssignmentEligibility {
  // Hard blocker: Suspended, Blocked, or Offline
  if (HARD_BLOCKER_STATUSES.has(driver.status)) {
    return {
      canAssign: false,
      reason: `Driver is ${driver.status} and cannot be assigned`,
    };
  }

  // Hard blocker: Not onboarded
  if (!driver.isOnboarded) {
    return {
      canAssign: false,
      reason: 'Driver has not completed onboarding',
    };
  }

  // Time-scoped check: If trip starts soon, driver MUST be AVAILABLE
  if (tripStartAt) {
    const timeUntilStart = tripStartAt.getTime() - now.getTime();
    
    // If trip starts within the "soon-start" threshold
    if (timeUntilStart <= DRIVER_ASSIGNMENT_CONFIG.SOON_START_THRESHOLD_MS) {
      // Driver MUST be AVAILABLE for trips starting soon
      if (driver.status !== DriverStatus.AVAILABLE) {
        return {
          canAssign: false,
          reason: `Driver is ${driver.status} and cannot be assigned to a trip starting soon`,
        };
      }
    }
  }

  // All checks passed
  return {
    canAssign: true,
  };
}

/**
 * Helper to check driver eligibility for a reservation
 * Extracts trip start time from reservation itinerary
 */
export function canAssignDriverToReservation(
  driver: Driver,
  itinerary: ReservationItinerary[],
  now: Date = new Date()
): DriverAssignmentEligibility {
  const tripStartAt = getEarliestTripStart(itinerary);
  return canAssignDriver(driver, tripStartAt, now);
}

/**
 * Helper to check driver eligibility for a quote
 * Extracts trip start time from quote itinerary
 */
export function canAssignDriverToQuote(
  driver: Driver,
  itinerary: QuoteItinerary[],
  now: Date = new Date()
): DriverAssignmentEligibility {
  const tripStartAt = getEarliestTripStart(itinerary);
  return canAssignDriver(driver, tripStartAt, now);
}

