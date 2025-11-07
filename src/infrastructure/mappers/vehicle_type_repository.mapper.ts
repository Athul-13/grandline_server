import { VehicleType } from '../../domain/entities/vehicle_type.entity';
import { IVehicleTypeModel } from '../database/mongodb/models/vehicle_type.model';

/**
 * Repository mapper for VehicleType entity
 * Converts MongoDB documents to domain entities
 */
export class VehicleTypeRepositoryMapper {

  static toEntity(doc: IVehicleTypeModel): VehicleType {
    return new VehicleType(
      doc.vehicleTypeId,
      doc.name,
      doc.description || '',
      doc.createdAt,
      doc.updatedAt
    );
  }

  static toEntities(docs: IVehicleTypeModel[]): VehicleType[] {
    return docs.map(doc => this.toEntity(doc));
  }
}