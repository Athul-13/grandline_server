import { Passenger } from '../../domain/entities/passenger.entity';
import { IPassengerModel } from '../database/mongodb/models/passenger.model';

/**
 * Repository mapper for Passenger entity
 * Converts MongoDB documents to domain entities
 */
export class PassengerRepositoryMapper {
  static toEntity(doc: IPassengerModel): Passenger {
    return new Passenger(
      doc.passengerId,
      doc.fullName,
      doc.phoneNumber,
      doc.age,
      doc.createdAt,
      doc.updatedAt,
      doc.quoteId,
      doc.reservationId
    );
  }

  static toEntities(docs: IPassengerModel[]): Passenger[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

