import { injectable } from 'tsyringe';
import {
  IVehicleRecommendationService,
  IVehicleRecommendation,
} from '../../domain/services/vehicle_recommendation_service.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { v4 as uuidv4 } from 'uuid';

/**
 * Vehicle recommendation service implementation
 * Handles vehicle recommendations based on passenger count
 * Improved algorithm with upper capacity limits and better sorting
 */
@injectable()
export class VehicleRecommendationServiceImpl implements IVehicleRecommendationService {
  // Maximum capacity multiplier for exact matches (prevents recommending oversized vehicles)
  private readonly MAX_EXACT_MATCH_MULTIPLIER = 2.5;
  
  // Maximum capacity multiplier for combinations (allows slightly more flexibility)
  private readonly MAX_COMBINATION_MULTIPLIER = 1.3;

  getRecommendations(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): IVehicleRecommendation[] {
    const recommendations: IVehicleRecommendation[] = [];

    // Filter out duplicate vehicles by name (case-insensitive)
    const uniqueVehicles = this.filterDuplicateVehiclesByName(availableVehicles);

    // Find exact matches (single vehicle with reasonable capacity range)
    const exactMatches = this.findExactMatches(passengerCount, uniqueVehicles);
    exactMatches.forEach((match) => {
      const totalCapacity = match.vehicle.capacity * match.quantity;
      recommendations.push({
        optionId: uuidv4(),
        vehicles: [match],
        totalCapacity,
        estimatedPrice: match.vehicle.baseFare * match.quantity,
        isExactMatch: true,
      });
    });

    // Find combinations (only if no good exact matches found)
    const combinations = this.findCombinations(passengerCount, uniqueVehicles);
    combinations.forEach((combination) => {
      const totalCapacity = combination.reduce(
        (sum, { vehicle, quantity }) => sum + vehicle.capacity * quantity,
        0
      );
      const estimatedPrice = combination.reduce(
        (sum, { vehicle, quantity }) => sum + vehicle.baseFare * quantity,
        0
      );

      recommendations.push({
        optionId: uuidv4(),
        vehicles: combination,
        totalCapacity,
        estimatedPrice,
        isExactMatch: false,
      });
    });

    // Sort by: exact matches first, then by score (considers capacity difference and waste factor)
    recommendations.sort((a, b) => {
      // Exact matches always come first
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      
      // Calculate score (lower is better)
      const aScore = this.calculateRecommendationScore(a, passengerCount);
      const bScore = this.calculateRecommendationScore(b, passengerCount);
      
      return aScore - bScore;
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  findExactMatches(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): Array<{ vehicle: Vehicle; quantity: number }> {
    const matches: Array<{ vehicle: Vehicle; quantity: number }> = [];
    const maxCapacity = passengerCount * this.MAX_EXACT_MATCH_MULTIPLIER;

    for (const vehicle of availableVehicles) {
      // Only include vehicles that can accommodate passengers but aren't excessively oversized
      if (vehicle.capacity >= passengerCount && vehicle.capacity <= maxCapacity) {
        matches.push({ vehicle, quantity: 1 });
      }
    }

    return matches;
  }

  findCombinations(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): Array<Array<{ vehicle: Vehicle; quantity: number }>> {
    const combinations: Array<Array<{ vehicle: Vehicle; quantity: number }>> = [];
    const maxCapacity = passengerCount * this.MAX_COMBINATION_MULTIPLIER;
    const minCapacity = passengerCount;

    // Filter vehicles that are too large individually (only use smaller vehicles for combinations)
    const suitableVehicles = availableVehicles.filter(
      (v) => v.capacity < passengerCount && v.capacity > 0
    );

    // If no suitable vehicles for combinations, return empty
    if (suitableVehicles.length === 0) {
      return [];
    }

    // Sort vehicles by capacity (descending) for better combination finding
    const sortedVehicles = [...suitableVehicles].sort((a, b) => b.capacity - a.capacity);

    // Try combinations of 2 vehicles (most common case)
    for (let i = 0; i < sortedVehicles.length; i++) {
      for (let j = i; j < sortedVehicles.length; j++) {
        const vehicle1 = sortedVehicles[i];
        const vehicle2 = sortedVehicles[j];

        // Try different quantities (max 3 of each to avoid excessive combinations)
        for (let q1 = 1; q1 <= 3; q1++) {
          for (let q2 = 1; q2 <= 3; q2++) {
            // Skip if same vehicle with quantity > 1 (handled by exact match)
            if (vehicle1.vehicleId === vehicle2.vehicleId && q1 === 1 && q2 === 1) {
              continue;
            }

            const totalCapacity = vehicle1.capacity * q1 + vehicle2.capacity * q2;

            // Check if combination fits within reasonable range
            if (totalCapacity >= minCapacity && totalCapacity <= maxCapacity) {
              const combination: Array<{ vehicle: Vehicle; quantity: number }> = [];
              
              if (q1 > 0) {
                combination.push({ vehicle: vehicle1, quantity: q1 });
              }
              
              // Add second vehicle only if different or if we need multiple of same type
              if (vehicle1.vehicleId !== vehicle2.vehicleId) {
                if (q2 > 0) {
                  combination.push({ vehicle: vehicle2, quantity: q2 });
                }
              } else if (q1 + q2 > 1) {
                // Same vehicle, combine quantities
                combination[0].quantity = q1 + q2;
              }

              if (combination.length > 0) {
                combinations.push(combination);
              }
            }
          }
        }
      }
    }

    // Remove duplicates
    const uniqueCombinations = combinations.filter((combo, index, self) => {
      const key = combo
        .map((v) => `${v.vehicle.vehicleId}:${v.quantity}`)
        .sort()
        .join(',');
      return (
        index ===
        self.findIndex(
          (c) =>
            c
              .map((v) => `${v.vehicle.vehicleId}:${v.quantity}`)
              .sort()
              .join(',') === key
        )
      );
    });

    // Sort combinations by total capacity (closest to passenger count first)
    uniqueCombinations.sort((a, b) => {
      const aCapacity = a.reduce((sum, v) => sum + v.vehicle.capacity * v.quantity, 0);
      const bCapacity = b.reduce((sum, v) => sum + v.vehicle.capacity * v.quantity, 0);
      const aDiff = Math.abs(aCapacity - passengerCount);
      const bDiff = Math.abs(bCapacity - passengerCount);
      return aDiff - bDiff;
    });

    return uniqueCombinations.slice(0, 10); // Limit to 10 best combinations
  }

  /**
   * Filters out duplicate vehicles by name (case-insensitive)
   * When duplicates are found, keeps the first occurrence
   * @param vehicles Array of vehicles to filter
   * @returns Array of unique vehicles (by name, case-insensitive)
   */
  private filterDuplicateVehiclesByName(vehicles: Vehicle[]): Vehicle[] {
    const seen = new Map<string, Vehicle>();

    for (const vehicle of vehicles) {
      const normalizedName = vehicle.vehicleModel.trim().toLowerCase();
      
      // If we haven't seen this vehicle name before, add it
      if (!seen.has(normalizedName)) {
        seen.set(normalizedName, vehicle);
      }
      // If duplicate found, keep the first one (already in map)
    }

    return Array.from(seen.values());
  }

  /**
   * Calculates a score for a recommendation (lower is better)
   * Considers capacity difference and waste factor
   */
  private calculateRecommendationScore(
    recommendation: IVehicleRecommendation,
    passengerCount: number
  ): number {
    const capacityDiff = Math.abs(recommendation.totalCapacity - passengerCount);
    
    // Calculate waste factor (excess capacity percentage)
    const wasteFactor =
      recommendation.totalCapacity > passengerCount
        ? (recommendation.totalCapacity - passengerCount) / passengerCount
        : 0;

    // Base score is capacity difference
    // Add penalty for waste (excess capacity)
    // Multiply waste penalty by 2 to heavily penalize oversized vehicles
    const score = capacityDiff + wasteFactor * passengerCount * 2;

    return score;
  }
}

