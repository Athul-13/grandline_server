import { injectable } from 'tsyringe';
import { IPaymentRepository } from '../../domain/repositories/payment_repository.interface';
import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentModel, createPaymentModel } from '../database/mongodb/models/payment.model';
import { PaymentRepositoryMapper } from '../mappers/payment_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { PaymentStatus } from '../../domain/entities/payment.entity';

/**
 * Payment repository implementation
 * Handles data persistence operations for Payment entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class PaymentRepositoryImpl
  extends MongoBaseRepository<IPaymentModel, Payment>
  implements IPaymentRepository {
  private readonly paymentModel: IDatabaseModel<IPaymentModel>;

  constructor() {
    const model = createPaymentModel();
    super(model, 'paymentId');
    this.paymentModel = model;
  }

  protected toEntity(doc: IPaymentModel): Payment {
    return PaymentRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Payment): Partial<IPaymentModel> {
    return {
      paymentId: entity.paymentId,
      quoteId: entity.quoteId,
      userId: entity.userId,
      amount: entity.amount,
      currency: entity.currency,
      paymentMethod: entity.paymentMethod,
      status: entity.status,
      paymentIntentId: entity.paymentIntentId,
      transactionId: entity.transactionId,
      paidAt: entity.paidAt,
      metadata: entity.metadata,
    };
  }

  async findByQuoteId(quoteId: string): Promise<Payment[]> {
    const docs = await this.paymentModel.find({ quoteId });
    return PaymentRepositoryMapper.toEntities(docs);
  }

  async findByPaymentIntentId(paymentIntentId: string): Promise<Payment | null> {
    const doc = await this.paymentModel.findOne({ paymentIntentId });
    return doc ? this.toEntity(doc) : null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const docs = await this.paymentModel.find({ userId });
    return PaymentRepositoryMapper.toEntities(docs);
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const docs = await this.paymentModel.find({ status });
    return PaymentRepositoryMapper.toEntities(docs);
  }
}
