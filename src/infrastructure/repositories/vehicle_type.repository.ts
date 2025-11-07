import { injectable } from 'tsyringe';
import { IVehicleTypeRepository } from '../../domain/repositories/vehicle_type_repository.interface';
import { VehicleType } from '../../domain/entities/vehicle_type.entity';
import { IVehicleTypeModel, createVehicleTypeModel } from '../database/mongodb/models/vehicle_type.model';
import { VehicleTypeRepositoryMapper } from '../mappers/vehicle_type_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * VehicleType repository implementation
 * Handles data persistence operations for VehicleType entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class VehicleTypeRepositoryImpl
  extends MongoBaseRepository<IVehicleTypeModel, VehicleType>
  implements IVehicleTypeRepository {

  private readonly vehicleTypeModel: IDatabaseModel<IVehicleTypeModel>;

  constructor() {
    // Create model instance using factory
    const model = createVehicleTypeModel();
    super(model, 'vehicleTypeId'); // Pass idField name
    this.vehicleTypeModel = model;
  }

  protected toEntity(doc: IVehicleTypeModel): VehicleType {
    return VehicleTypeRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: VehicleType): Partial<IVehicleTypeModel> {
    return {
      vehicleTypeId: entity.vehicleTypeId,
      name: entity.name,
      description: entity.description,
    };
  }

  async findByName(name: string): Promise<VehicleType | null> {
    const doc = await this.vehicleTypeModel.findOne({ name });
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(): Promise<VehicleType[]> {
    const docs = await this.vehicleTypeModel.find({});
    return VehicleTypeRepositoryMapper.toEntities(docs);
  }
}