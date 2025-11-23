import { injectable } from 'tsyringe';
import { IMessageRepository } from '../../domain/repositories/message_repository.interface';
import { Message } from '../../domain/entities/message.entity';
import { IMessageModel, createMessageModel } from '../database/mongodb/models/message.model';
import { MessageRepositoryMapper } from '../mappers/message_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';
import { MessageDeliveryStatus } from '../../shared/constants';

/**
 * Message repository implementation
 * Handles data persistence operations for Message entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class MessageRepositoryImpl
  extends MongoBaseRepository<IMessageModel, Message>
  implements IMessageRepository {
  private readonly messageModel: IDatabaseModel<IMessageModel>;

  constructor() {
    const model = createMessageModel();
    super(model, 'messageId');
    this.messageModel = model;
  }

  protected toEntity(doc: IMessageModel): Message {
    return MessageRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: Message): Partial<IMessageModel> {
    return {
      messageId: entity.messageId,
      chatId: entity.chatId,
      senderId: entity.senderId,
      content: entity.content,
      deliveryStatus: entity.deliveryStatus,
      readAt: entity.readAt,
      readBy: entity.readBy,
    };
  }

  async findByChatId(chatId: string): Promise<Message[]> {
    const docs = await this.messageModel.find(
      { chatId },
      { sort: { createdAt: 1 } }
    );
    return MessageRepositoryMapper.toEntities(docs);
  }

  async findByChatIdPaginated(
    chatId: string,
    page: number,
    limit: number
  ): Promise<Message[]> {
    const skip = (page - 1) * limit;
    // Note: MongoDBModelImpl doesn't support skip/limit directly
    // We'll need to use aggregate or extend the base model
    // For now, we'll fetch all and paginate in memory (not ideal for large datasets)
    const allDocs = await this.messageModel.find(
      { chatId },
      { sort: { createdAt: -1 } }
    );
    const paginatedDocs = allDocs.slice(skip, skip + limit);
    return MessageRepositoryMapper.toEntities(paginatedDocs);
  }

  async markAsRead(messageId: string, userId: string): Promise<void> {
    await this.messageModel.updateOne(
      { messageId },
      {
        $set: {
          deliveryStatus: MessageDeliveryStatus.READ,
          readAt: new Date(),
          readBy: userId,
        },
      }
    );
  }

  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    await this.messageModel.updateMany(
      {
        chatId,
        senderId: { $ne: userId },
        deliveryStatus: { $ne: MessageDeliveryStatus.READ },
      },
      {
        $set: {
          deliveryStatus: MessageDeliveryStatus.READ,
          readAt: new Date(),
          readBy: userId,
        },
      }
    );
  }

  async getUnreadCount(chatId: string, userId: string): Promise<number> {
    const docs = await this.messageModel.find({
      chatId,
      senderId: { $ne: userId },
      deliveryStatus: { $ne: MessageDeliveryStatus.READ },
    });
    return docs.length;
  }

  async getTotalUnreadCount(userId: string): Promise<number> {
    // Get all chats where user is a participant
    // Then count unread messages in those chats
    // This requires aggregation or multiple queries
    // For now, we'll use a simpler approach with find
    const docs = await this.messageModel.find({
      senderId: { $ne: userId },
      deliveryStatus: { $ne: MessageDeliveryStatus.READ },
    });
    
    // Group by chatId and count unique chats with unread messages
    const chatIds = new Set(docs.map((doc) => doc.chatId));
    return chatIds.size;
  }

  async updateDeliveryStatus(
    messageId: string,
    status: MessageDeliveryStatus
  ): Promise<void> {
    await this.messageModel.updateOne(
      { messageId },
      { $set: { deliveryStatus: status } }
    );
  }

  async findLastMessageByChatId(chatId: string): Promise<Message | null> {
    const docs = await this.messageModel.find(
      { chatId },
      { sort: { createdAt: -1 } }
    );
    if (docs.length === 0) {
      return null;
    }
    return this.toEntity(docs[0]);
  }
}

