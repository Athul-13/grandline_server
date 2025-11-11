import { Amenity } from '../../domain/entities/amenity.entity';
import { IAmenityModel } from '../database/mongodb/models/amenity.model';

/**
 * Repository mapper for Amenity entity
 * Converts MongoDB documents to domain entities
 */
export class AmenityRepositoryMapper {
  static toEntity(doc: IAmenityModel): Amenity {
    return new Amenity(
      doc.amenityId,
      doc.name,
      doc.price,
      doc.createdAt,
      doc.updatedAt,
    );
  }

  static toEntities(docs: IAmenityModel[]): Amenity[] {
    return docs.map(doc => this.toEntity(doc));
  }
}

