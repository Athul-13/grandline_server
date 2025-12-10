import { Payment } from '../../domain/entities/payment.entity';
import { IPaymentModel } from '../database/mongodb/models/payment.model';

/**
 * Repository mapper for Payment entity
 * Converts MongoDB documents to domain entities
 */
export class PaymentRepositoryMapper {
  static toEntity(doc: IPaymentModel): Payment {
    return new Payment(
      doc.paymentId,
      doc.quoteId,
      doc.userId,
      doc.amount,
      doc.currency,
      doc.paymentMethod,
      doc.status,
      doc.createdAt,
      doc.updatedAt,
      doc.paymentIntentId,
      doc.transactionId,
      doc.paidAt,
      doc.metadata
    );
  }

  static toEntities(docs: IPaymentModel[]): Payment[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}
