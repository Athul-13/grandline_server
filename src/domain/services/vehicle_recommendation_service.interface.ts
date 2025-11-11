import { Vehicle } from '../entities/vehicle.entity';

/**
 * Vehicle recommendation option
 */
export interface IVehicleRecommendation {
  optionId: string;
  vehicles: Array<{ vehicle: Vehicle; quantity: number }>;
  totalCapacity: number;
  estimatedPrice: number; // rough estimate
  isExactMatch: boolean;
}

/**
 * Vehicle recommendation service interface
 * Defines the contract for recommending vehicles based on passenger count
 */
export interface IVehicleRecommendationService {
  /**
   * Gets vehicle recommendations based on passenger count
   * Returns multiple options including exact matches and combinations
   */
  getRecommendations(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): IVehicleRecommendation[];

  /**
   * Finds exact match vehicles (single vehicle with capacity >= passenger count)
   */
  findExactMatches(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): Array<{ vehicle: Vehicle; quantity: number }>;

  /**
   * Finds vehicle combinations that can accommodate passenger count
   */
  findCombinations(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): Array<Array<{ vehicle: Vehicle; quantity: number }>>;
}

