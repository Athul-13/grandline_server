import { Vehicle } from '../../domain/entities/vehicle.entity';
import { IVehicleModel } from '../database/mongodb/models/vehicle.model';
import { VehicleStatus } from '../../shared/constants';

/**
 * Repository mapper for Vehicle entity
 * Converts MongoDB documents to domain entities
 */
export class VehicleRepositoryMapper {

  static toEntity(doc: IVehicleModel): Vehicle {
    return new Vehicle(
      doc.vehicleId,
      doc.vehicleTypeId,
      doc.capacity,
      doc.baseFare,
      doc.maintenance,
      doc.plateNumber,
      doc.vehicleModel,
      doc.year,
      doc.fuelConsumption,
      doc.status as VehicleStatus,
      doc.createdAt,
      doc.updatedAt,
      doc.imageUrls && doc.imageUrls.length > 0 ? doc.imageUrls : undefined,
      doc.amenityIds && doc.amenityIds.length > 0 ? doc.amenityIds : []
    );
  }

  static toEntities(docs: IVehicleModel[]): Vehicle[] {
    return docs.map(doc => this.toEntity(doc));
  }
}