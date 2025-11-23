import { Notification } from '../../domain/entities/notification.entity';
import { INotificationModel } from '../database/mongodb/models/notification.model';

/**
 * Repository mapper for Notification entity
 * Converts MongoDB documents to domain entities
 */
export class NotificationRepositoryMapper {
  static toEntity(doc: INotificationModel): Notification {
    return new Notification(
      doc.notificationId,
      doc.userId,
      doc.type,
      doc.title,
      doc.message,
      doc.isRead,
      doc.createdAt,
      doc.data as Record<string, unknown> | undefined
    );
  }

  static toEntities(docs: INotificationModel[]): Notification[] {
    return docs.map((doc) => this.toEntity(doc));
  }
}

