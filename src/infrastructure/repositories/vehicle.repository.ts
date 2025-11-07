import { injectable } from 'tsyringe';
import { IVehicleRepository } from '../../domain/repositories/vehicle_repository.interface';
import { Vehicle } from '../../domain/entities/vehicle.entity';
import { IVehicleModel, createVehicleModel } from '../database/mongodb/models/vehicle.model';
import { VehicleRepositoryMapper } from '../mappers/vehicle_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { VehicleStatus } from '../../shared/constants';

/**
 * Vehicle repository implementation
 * Handles data persistence operations for Vehicle entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class VehicleRepositoryImpl
  extends MongoBaseRepository<IVehicleModel, Vehicle>
  implements IVehicleRepository {

  private readonly vehicleModel: IDatabaseModel<IVehicleModel>;

  constructor() {
    // Create model instance using factory
    const model = createVehicleModel();
    super(model, 'vehicleId'); // Pass idField name
    this.vehicleModel = model;
  }

  protected toEntity(doc: IVehicleModel): Vehicle {
    return VehicleRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Vehicle): Partial<IVehicleModel> {
    return {
      vehicleId: entity.vehicleId,
      vehicleTypeId: entity.vehicleTypeId,
      capacity: entity.capacity,
      baseFare: entity.baseFare,
      maintenance: entity.maintenance,
      plateNumber: entity.plateNumber,
      vehicleModel: entity.vehicleModel,
      year: entity.year,
      fuelConsumption: entity.fuelConsumption,
      status: entity.status,
    };
  }

  async findByVehicleTypeId(vehicleTypeId: string): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ vehicleTypeId });
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async findByPlateNumber(plateNumber: string): Promise<Vehicle | null> {
    const doc = await this.vehicleModel.findOne({ plateNumber: plateNumber.toUpperCase() });
    return doc ? this.toEntity(doc) : null;
  }

  async findAvailableVehicles(): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ status: VehicleStatus.AVAILABLE });
    return VehicleRepositoryMapper.toEntities(docs);
  }

  async findByStatus(status: VehicleStatus): Promise<Vehicle[]> {
    const docs = await this.vehicleModel.find({ status });
    return VehicleRepositoryMapper.toEntities(docs);
  }
}