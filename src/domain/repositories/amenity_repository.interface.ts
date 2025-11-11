import { Amenity } from '../entities/amenity.entity';
import { IBaseRepository } from './base_repository.interface';

/**
 * Repository interface for Amenity entity operations
 * Defines the contract for data access layer implementations
 */
export interface IAmenityRepository extends IBaseRepository<Amenity> {
  /**
   * Finds amenities with price > 0 (paid amenities)
   * Used for reservation selection
   */
  findPaidAmenities(): Promise<Amenity[]>;

  /**
   * Finds an amenity by name
   * Used for duplicate checking
   */
  findByName(name: string): Promise<Amenity | null>;

  /**
   * Finds multiple amenities by their IDs
   * Used for bulk fetching when calculating prices
   */
  findByIds(ids: string[]): Promise<Amenity[]>;

  /**
   * Finds all amenities
   * Used for getting all amenities with pagination
   */
  findAll(): Promise<Amenity[]>;
}

