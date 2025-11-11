import { VehicleStatus } from '../../shared/constants';

/**
 * Filter interface for vehicle queries
 * Defines the structure for filtering vehicles at the repository level
 * This is a domain concept - no implementation details
 */
export interface VehicleFilter {
  /**
   * Filter by vehicle status(es)
   * Multiple statuses can be provided (OR condition)
   */
  status?: VehicleStatus[];

  /**
   * Minimum base fare (inclusive)
   */
  baseFareMin?: number;

  /**
   * Maximum base fare (inclusive)
   */
  baseFareMax?: number;

  /**
   * Minimum capacity (greater than or equal to)
   * Filters vehicles with capacity >= this value
   */
  capacity?: number;

  /**
   * Minimum year (inclusive)
   * Filters vehicles with year >= this value
   */
  yearMin?: number;

  /**
   * Maximum year (inclusive)
   * Filters vehicles with year <= this value
   */
  yearMax?: number;
}

