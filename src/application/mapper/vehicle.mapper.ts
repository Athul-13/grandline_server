import { VehicleType } from '../../domain/entities/vehicle_type.entity';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import {
  VehicleTypeResponse,
  CreateVehicleTypeResponse,
  VehicleResponse,
  CreateVehicleResponse,
  GetVehicleResponse,
  GetAllVehiclesResponse,
  GetVehiclesByTypeResponse,
  UpdateVehicleResponse,
  UpdateVehicleStatusResponse,
} from '../dtos/vehicle.dto';
import { SUCCESS_MESSAGES } from '../../shared/constants';

/**
 * Mapper class for converting Vehicle and VehicleType entities to response DTOs
 */
export class VehicleMapper {
  static toVehicleTypeResponse(vehicleType: VehicleType, vehicleCount: number): VehicleTypeResponse {
    return {
      vehicleTypeId: vehicleType.vehicleTypeId,
      name: vehicleType.name,
      description: vehicleType.description,
      vehicleCount: vehicleCount,
      createdAt: vehicleType.createdAt,
      updatedAt: vehicleType.updatedAt,
    };
  }

  static toCreateVehicleTypeResponse(vehicleType: VehicleType): CreateVehicleTypeResponse {
    return {
      message: SUCCESS_MESSAGES.VEHICLE_TYPE_CREATED,
      vehicleType: this.toVehicleTypeResponse(vehicleType, 0),
    };
  }

  static toVehicleResponse(vehicle: Vehicle): VehicleResponse {
    return {
      vehicleId: vehicle.vehicleId,
      vehicleTypeId: vehicle.vehicleTypeId,
      capacity: vehicle.capacity,
      baseFare: vehicle.baseFare,
      maintenance: vehicle.maintenance,
      plateNumber: vehicle.plateNumber,
      vehicleModel: vehicle.vehicleModel,
      year: vehicle.year,
      fuelConsumption: vehicle.fuelConsumption,
      imageUrls: vehicle.imageUrls,
      status: vehicle.status,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }

  static toCreateVehicleResponse(vehicle: Vehicle): CreateVehicleResponse {
    return {
      message: SUCCESS_MESSAGES.VEHICLE_CREATED,
      vehicle: this.toVehicleResponse(vehicle),
    };
  }

  static toGetVehicleResponse(vehicle: Vehicle): GetVehicleResponse {
    return {
      vehicle: this.toVehicleResponse(vehicle),
    };
  }

  static toGetAllVehiclesResponse(vehicles: Vehicle[]): GetAllVehiclesResponse {
    return {
      vehicles: vehicles.map(vehicle => this.toVehicleResponse(vehicle)),
    };
  }

  static toGetVehiclesByTypeResponse(vehicles: Vehicle[]): GetVehiclesByTypeResponse {
    return {
      vehicles: vehicles.map(vehicle => this.toVehicleResponse(vehicle)),
    };
  }

  static toUpdateVehicleResponse(vehicle: Vehicle): UpdateVehicleResponse {
    return {
      message: SUCCESS_MESSAGES.VEHICLE_UPDATED,
      vehicle: this.toVehicleResponse(vehicle),
    };
  }

  static toUpdateVehicleStatusResponse(vehicle: Vehicle): UpdateVehicleStatusResponse {
    return {
      message: SUCCESS_MESSAGES.VEHICLE_STATUS_UPDATED,
      vehicle: this.toVehicleResponse(vehicle),
    };
  }
}