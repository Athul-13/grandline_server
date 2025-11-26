import { injectable } from 'tsyringe';
import { INotificationRepository } from '../../domain/repositories/notification_repository.interface';
import { Notification } from '../../domain/entities/notification.entity';
import {
  INotificationModel,
  createNotificationModel,
} from '../database/mongodb/models/notification.model';
import { NotificationRepositoryMapper } from '../mappers/notification_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { NotificationType } from '../../shared/constants';

/**
 * Notification repository implementation
 * Handles data persistence operations for Notification entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class NotificationRepositoryImpl
  extends MongoBaseRepository<INotificationModel, Notification>
  implements INotificationRepository {
  private readonly notificationModel: IDatabaseModel<INotificationModel>;

  constructor() {
    const model = createNotificationModel();
    super(model, 'notificationId');
    this.notificationModel = model;
  }

  protected toEntity(doc: INotificationModel): Notification {
    return NotificationRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Notification): Partial<INotificationModel> {
    return {
      notificationId: entity.notificationId,
      userId: entity.userId,
      type: entity.type,
      title: entity.title,
      message: entity.message,
      data: entity.data,
      isRead: entity.isRead,
    };
  }

  async findByUserId(userId: string): Promise<Notification[]> {
    const docs = await this.notificationModel.find(
      { userId },
      { sort: { createdAt: -1 } }
    );
    return NotificationRepositoryMapper.toEntities(docs);
  }

  async findByUserIdPaginated(
    userId: string,
    page: number,
    limit: number
  ): Promise<Notification[]> {
    const skip = (page - 1) * limit;
    // Note: Similar pagination limitation as message repository
    const allDocs = await this.notificationModel.find(
      { userId },
      { sort: { createdAt: -1 } }
    );
    const paginatedDocs = allDocs.slice(skip, skip + limit);
    return NotificationRepositoryMapper.toEntities(paginatedDocs);
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    const docs = await this.notificationModel.find(
      { userId, isRead: false },
      { sort: { createdAt: -1 } }
    );
    return NotificationRepositoryMapper.toEntities(docs);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const docs = await this.notificationModel.find({
      userId,
      isRead: false,
    });
    return docs.length;
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationModel.updateOne(
      { notificationId },
      { $set: { isRead: true } }
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );
  }

  async findByUserIdAndType(
    userId: string,
    type: NotificationType
  ): Promise<Notification[]> {
    const docs = await this.notificationModel.find(
      { userId, type },
      { sort: { createdAt: -1 } }
    );
    return NotificationRepositoryMapper.toEntities(docs);
  }

  async markChatNotificationsAsRead(userId: string, chatId: string): Promise<void> {
    await this.notificationModel.updateMany(
      {
        userId,
        type: NotificationType.CHAT_MESSAGE,
        isRead: false,
        'data.chatId': chatId,
      },
      { $set: { isRead: true } }
    );
  }
}

