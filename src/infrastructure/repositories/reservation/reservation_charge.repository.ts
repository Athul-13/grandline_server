import { injectable } from 'tsyringe';
import { IReservationChargeRepository } from '../../../domain/repositories/reservation_charge_repository.interface';
import { ReservationCharge } from '../../../domain/entities/reservation_charge.entity';
import {
  IReservationChargeModel,
  createReservationChargeModel,
} from '../../database/mongodb/models/reservation_charge.model';
import { ReservationChargeRepositoryMapper } from '../../mappers/reservation_charge_repository.mapper';
import { MongoBaseRepository } from '../base/mongo_base.repository';
import { IDatabaseModel } from '../../../domain/services/mongodb_model.interface';

/**
 * ReservationCharge repository implementation
 * Handles data persistence operations for ReservationCharge entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class ReservationChargeRepositoryImpl
  extends MongoBaseRepository<IReservationChargeModel, ReservationCharge>
  implements IReservationChargeRepository {
  private readonly chargeModel: IDatabaseModel<IReservationChargeModel>;

  constructor() {
    const model = createReservationChargeModel();
    super(model, 'chargeId');
    this.chargeModel = model;
  }

  protected toEntity(doc: IReservationChargeModel): ReservationCharge {
    return ReservationChargeRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: ReservationCharge): Partial<IReservationChargeModel> {
    return {
      chargeId: entity.chargeId,
      reservationId: entity.reservationId,
      chargeType: entity.chargeType,
      description: entity.description,
      amount: entity.amount,
      currency: entity.currency,
      addedBy: entity.addedBy,
      isPaid: entity.isPaid,
      paidAt: entity.paidAt,
    };
  }

  async findByReservationId(reservationId: string): Promise<ReservationCharge[]> {
    const docs = await this.chargeModel.find({ reservationId });
    return ReservationChargeRepositoryMapper.toEntities(docs);
  }

  async findUnpaidByReservationId(reservationId: string): Promise<ReservationCharge[]> {
    const docs = await this.chargeModel.find({ reservationId, isPaid: false });
    return ReservationChargeRepositoryMapper.toEntities(docs);
  }

  async findByReservationIdAndType(
    reservationId: string,
    chargeType: ReservationCharge['chargeType']
  ): Promise<ReservationCharge[]> {
    const docs = await this.chargeModel.find({ reservationId, chargeType });
    return ReservationChargeRepositoryMapper.toEntities(docs);
  }
}

