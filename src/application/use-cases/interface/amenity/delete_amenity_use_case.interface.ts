/**
 * Interface for deleting amenity use case
 */
export interface IDeleteAmenityUseCase {
  execute(id: string): Promise<void>;
}

