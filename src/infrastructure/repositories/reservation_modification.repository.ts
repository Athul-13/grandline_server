import { injectable } from 'tsyringe';
import { IReservationModificationRepository } from '../../domain/repositories/reservation_modification_repository.interface';
import { ReservationModification } from '../../domain/entities/reservation_modification.entity';
import {
  IReservationModificationModel,
  createReservationModificationModel,
} from '../database/mongodb/models/reservation_modification.model';
import { ReservationModificationRepositoryMapper } from '../mappers/reservation_modification_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * ReservationModification repository implementation
 * Handles data persistence operations for ReservationModification entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class ReservationModificationRepositoryImpl
  extends MongoBaseRepository<IReservationModificationModel, ReservationModification>
  implements IReservationModificationRepository {
  private readonly modificationModel: IDatabaseModel<IReservationModificationModel>;

  constructor() {
    const model = createReservationModificationModel();
    super(model, 'modificationId');
    this.modificationModel = model;
  }

  protected toEntity(doc: IReservationModificationModel): ReservationModification {
    return ReservationModificationRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: ReservationModification): Partial<IReservationModificationModel> {
    return {
      modificationId: entity.modificationId,
      reservationId: entity.reservationId,
      modifiedBy: entity.modifiedBy,
      modificationType: entity.modificationType,
      description: entity.description,
      previousValue: entity.previousValue,
      newValue: entity.newValue,
      metadata: entity.metadata,
    };
  }

  async findByReservationId(reservationId: string): Promise<ReservationModification[]> {
    const docs = await this.modificationModel.find(
      { reservationId },
      { sort: { createdAt: -1 } } // Newest first
    );
    return ReservationModificationRepositoryMapper.toEntities(docs);
  }

  async findByReservationIdAndType(
    reservationId: string,
    modificationType: ReservationModification['modificationType']
  ): Promise<ReservationModification[]> {
    const docs = await this.modificationModel.find(
      { reservationId, modificationType },
      { sort: { createdAt: -1 } }
    );
    return ReservationModificationRepositoryMapper.toEntities(docs);
  }
}

