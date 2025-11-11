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
 */
@injectable()
export class VehicleRecommendationServiceImpl implements IVehicleRecommendationService {
  getRecommendations(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): IVehicleRecommendation[] {
    const recommendations: IVehicleRecommendation[] = [];

    // Find exact matches (single vehicle with capacity >= passenger count)
    const exactMatches = this.findExactMatches(passengerCount, availableVehicles);
    exactMatches.forEach((match) => {
      recommendations.push({
        optionId: uuidv4(),
        vehicles: [match],
        totalCapacity: match.vehicle.capacity * match.quantity,
        estimatedPrice: match.vehicle.baseFare * match.quantity,
        isExactMatch: true,
      });
    });

    // Find combinations
    const combinations = this.findCombinations(passengerCount, availableVehicles);
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

    // Sort by: exact matches first, then by capacity (closest to passenger count)
    recommendations.sort((a, b) => {
      if (a.isExactMatch && !b.isExactMatch) return -1;
      if (!a.isExactMatch && b.isExactMatch) return 1;
      const aDiff = Math.abs(a.totalCapacity - passengerCount);
      const bDiff = Math.abs(b.totalCapacity - passengerCount);
      return aDiff - bDiff;
    });

    return recommendations.slice(0, 5); // Return top 5 recommendations
  }

  findExactMatches(
    passengerCount: number,
    availableVehicles: Vehicle[]
  ): Array<{ vehicle: Vehicle; quantity: number }> {
    const matches: Array<{ vehicle: Vehicle; quantity: number }> = [];

    for (const vehicle of availableVehicles) {
      if (vehicle.capacity >= passengerCount) {
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

    // Sort vehicles by capacity (descending)
    const sortedVehicles = [...availableVehicles].sort((a, b) => b.capacity - a.capacity);

    // Try combinations of 2 vehicles
    for (let i = 0; i < sortedVehicles.length; i++) {
      for (let j = i; j < sortedVehicles.length; j++) {
        const vehicle1 = sortedVehicles[i];
        const vehicle2 = sortedVehicles[j];

        // Try different quantities
        for (let q1 = 1; q1 <= 3; q1++) {
          for (let q2 = 1; q2 <= 3; q2++) {
            const totalCapacity = vehicle1.capacity * q1 + vehicle2.capacity * q2;
            if (totalCapacity >= passengerCount && totalCapacity <= passengerCount * 1.2) {
              // Within 20% of required capacity
              const combination: Array<{ vehicle: Vehicle; quantity: number }> = [];
              if (q1 > 0) combination.push({ vehicle: vehicle1, quantity: q1 });
              if (q2 > 0 && vehicle1.vehicleId !== vehicle2.vehicleId)
                combination.push({ vehicle: vehicle2, quantity: q2 });
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
      return index === self.findIndex((c) => c.map((v) => `${v.vehicle.vehicleId}:${v.quantity}`).sort().join(',') === key);
    });

    return uniqueCombinations.slice(0, 10); // Limit to 10 combinations
  }
}

