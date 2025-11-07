import { VehicleStatus } from "../../shared/constants";

/**
 * Vehicle domain entity representing a vehicle in the bus rental system
 * Contains core business logic and validation rules
 */
export class Vehicle {
    constructor(
        public readonly vehicleId: string,
        public readonly vehicleTypeId: string,
        public readonly capacity: number,
        public readonly baseFare: number,
        public readonly maintenance: number,
        public readonly plateNumber: string,
        public readonly vehicleModel: string,
        public readonly year: number,
        public readonly fuelConsumption: number,
        public readonly status: VehicleStatus,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

  /**
   * Checks if the vehicle is available for rental
   */
  isAvailable(): boolean {
    return this.status === VehicleStatus.AVAILABLE;
  }

  /**
   * Checks if the vehicle is currently in service
   */
  isInService(): boolean {
    return this.status === VehicleStatus.IN_SERVICE;
  }

  /**
   * Checks if the vehicle is under maintenance
   */
  isUnderMaintenance(): boolean {
    return this.status === VehicleStatus.MAINTENANCE;
  }       
}