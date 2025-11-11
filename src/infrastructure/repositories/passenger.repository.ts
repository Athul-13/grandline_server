import { injectable } from 'tsyringe';
import { IPassengerRepository } from '../../domain/repositories/passenger_repository.interface';
import { Passenger } from '../../domain/entities/passenger.entity';
import { IPassengerModel, createPassengerModel } from '../database/mongodb/models/passenger.model';
import { PassengerRepositoryMapper } from '../mappers/passenger_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * Passenger repository implementation
 * Handles data persistence operations for Passenger entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class PassengerRepositoryImpl
  extends MongoBaseRepository<IPassengerModel, Passenger>
  implements IPassengerRepository {
  private readonly passengerModel: IDatabaseModel<IPassengerModel>;

  constructor() {
    const model = createPassengerModel();
    super(model, 'passengerId');
    this.passengerModel = model;
  }

  protected toEntity(doc: IPassengerModel): Passenger {
    return PassengerRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Passenger): Partial<IPassengerModel> {
    return {
      passengerId: entity.passengerId,
      quoteId: entity.quoteId,
      reservationId: entity.reservationId,
      fullName: entity.fullName,
      phoneNumber: entity.phoneNumber,
      age: entity.age,
    };
  }

  async findByQuoteId(quoteId: string): Promise<Passenger[]> {
    const docs = await this.passengerModel.find({ quoteId });
    return PassengerRepositoryMapper.toEntities(docs);
  }

  async findByReservationId(reservationId: string): Promise<Passenger[]> {
    const docs = await this.passengerModel.find({ reservationId });
    return PassengerRepositoryMapper.toEntities(docs);
  }

  async deleteByQuoteId(quoteId: string): Promise<void> {
    await this.passengerModel.deleteMany({ quoteId });
  }

  async deleteByReservationId(reservationId: string): Promise<void> {
    await this.passengerModel.deleteMany({ reservationId });
  }
}

