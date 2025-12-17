import { injectable } from 'tsyringe';
import { IReservationItineraryRepository } from '../../../domain/repositories/reservation_itinerary_repository.interface';
import { ReservationItinerary } from '../../../domain/entities/reservation_itinerary.entity';
import {
  IReservationItineraryModel,
  createReservationItineraryModel,
} from '../../database/mongodb/models/reservation_itinerary.model';
import { ReservationItineraryRepositoryMapper } from '../../mappers/reservation_itinerary_repository.mapper';
import { MongoBaseRepository } from '../base/mongo_base.repository';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

/**
 * ReservationItinerary repository implementation
 * Handles data persistence operations for ReservationItinerary entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class ReservationItineraryRepositoryImpl
  extends MongoBaseRepository<IReservationItineraryModel, ReservationItinerary>
  implements IReservationItineraryRepository {
  private readonly itineraryModel: IDatabaseModel<IReservationItineraryModel>;

  constructor() {
    const model = createReservationItineraryModel();
    super(model, 'itineraryId');
    this.itineraryModel = model;
  }

  protected toEntity(doc: IReservationItineraryModel): ReservationItinerary {
    return ReservationItineraryRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: ReservationItinerary): Partial<IReservationItineraryModel> {
    return {
      itineraryId: entity.itineraryId,
      reservationId: entity.reservationId,
      tripType: entity.tripType,
      stopOrder: entity.stopOrder,
      locationName: entity.locationName,
      latitude: entity.latitude,
      longitude: entity.longitude,
      arrivalTime: entity.arrivalTime,
      departureTime: entity.departureTime,
      isDriverStaying: entity.isDriverStaying,
      stayingDuration: entity.stayingDuration,
      stopType: entity.stopType,
    };
  }

  async findByReservationId(reservationId: string): Promise<ReservationItinerary[]> {
    const docs = await this.itineraryModel.find({ reservationId });
    return ReservationItineraryRepositoryMapper.toEntities(docs);
  }

  async findByReservationIdAndTripType(
    reservationId: string,
    tripType: 'outbound' | 'return'
  ): Promise<ReservationItinerary[]> {
    const docs = await this.itineraryModel.find({ reservationId, tripType });
    return ReservationItineraryRepositoryMapper.toEntities(docs);
  }

  async deleteByReservationId(reservationId: string): Promise<void> {
    await this.itineraryModel.deleteMany({ reservationId });
  }

  async findByReservationIdOrdered(reservationId: string): Promise<ReservationItinerary[]> {
    const docs = await this.itineraryModel.find({ reservationId }, { sort: { stopOrder: 1 } });
    return ReservationItineraryRepositoryMapper.toEntities(docs);
  }
}

