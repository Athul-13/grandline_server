import { injectable } from 'tsyringe';
import { IAmenityRepository } from '../../domain/repositories/amenity_repository.interface';
import { Amenity } from '../../domain/entities/amenity.entity';
import { IAmenityModel, createAmenityModel } from '../database/mongodb/models/amenity.model';
import { AmenityRepositoryMapper } from '../mappers/amenity_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * Amenity repository implementation
 * Handles data persistence operations for Amenity entity using MongoDB
 */
@injectable()
export class AmenityRepositoryImpl
  extends MongoBaseRepository<IAmenityModel, Amenity>
  implements IAmenityRepository {

  private readonly amenityModel: IDatabaseModel<IAmenityModel>;

  constructor() {
    // Create model instance using factory
    const model = createAmenityModel();
    super(model, 'amenityId');
    this.amenityModel = model;
  }

  protected toEntity(doc: IAmenityModel): Amenity {
    return AmenityRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Amenity): Partial<IAmenityModel> {
    return {
      amenityId: entity.amenityId,
      name: entity.name,
      price: entity.price,
    };
  }

  async findPaidAmenities(): Promise<Amenity[]> {
    const docs = await this.amenityModel.find({ price: { $gt: 0 } });
    return AmenityRepositoryMapper.toEntities(docs);
  }

  async findByName(name: string): Promise<Amenity | null> {
    const doc = await this.amenityModel.findOne({ name: name.trim() });
    return doc ? this.toEntity(doc) : null;
  }

  async findByIds(ids: string[]): Promise<Amenity[]> {
    if (ids.length === 0) {
      return [];
    }
    const docs = await this.amenityModel.find({ amenityId: { $in: ids } });
    return AmenityRepositoryMapper.toEntities(docs);
  }

  async findAll(): Promise<Amenity[]> {
    const docs = await this.amenityModel.find({});
    return AmenityRepositoryMapper.toEntities(docs);
  }
}

