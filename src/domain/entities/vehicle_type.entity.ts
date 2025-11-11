/**
 * VehicleType domain entity representing a vehicle category
 * Contains core business logic and validation rules
 */
export class VehicleType {
    constructor(
        public readonly vehicleTypeId: string,
        public readonly name: string,
        public readonly description: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}
}