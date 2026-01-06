import { injectable } from 'tsyringe';
import { Server } from 'socket.io';
import { container } from 'tsyringe';
import { ISocketEventService } from '../../domain/services/socket_event_service.interface';
import { Message } from '../../domain/entities/message.entity';
import { Chat } from '../../domain/entities/chat.entity';
import { Quote } from '../../domain/entities/quote.entity';
import { Reservation } from '../../domain/entities/reservation.entity';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../application/di/tokens';
import { IChatRepository } from '../../domain/repositories/chat_repository.interface';
import { IMessageRepository } from '../../domain/repositories/message_repository.interface';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../domain/repositories/driver_repository.interface';
import { IReservationRepository } from '../../domain/repositories/reservation_repository.interface';
import { IQuoteRepository } from '../../domain/repositories/quote_repository.interface';
import { MessageDeliveryStatus, NotificationType, QuoteStatus, ReservationStatus, UserStatus, UserRole, DriverStatus } from '../../shared/constants';
import { User } from '../../domain/entities/user.entity';
import { Driver } from '../../domain/entities/driver.entity';
import { CreateNotificationRequest } from '../../application/dtos/notification.dto';
import { logger } from '../../shared/logger';
import { ChatSocketHandler } from '../../presentation/socket_handlers/chat_socket.handler';
import { NOTIFICATION_SOCKET_EVENTS, NotificationSocketHandler } from '../../presentation/socket_handlers/notification_socket.handler';
import { IGetUnreadNotificationCountUseCase } from '../../application/use-cases/interface/notification/get_unread_notification_count_use_case.interface';

/**
 * Socket event names for messages
 */
export const MESSAGE_SOCKET_EVENTS = {
  MESSAGE_SENT: 'message-sent',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
} as const;

/**
 * Socket event names for chats
 */
export const CHAT_SOCKET_EVENTS = {
  CHAT_CREATED: 'chat-created',
} as const;

/**
 * Socket event names for admin dashboard
 */
export const ADMIN_DASHBOARD_SOCKET_EVENTS = {
  QUOTE_CREATED: 'admin:quote-created',
  QUOTE_UPDATED: 'admin:quote-updated',
  QUOTE_STATUS_CHANGED: 'admin:quote-status-changed',
  QUOTE_EXPIRED: 'quote:expired',
  RESERVATION_CREATED: 'admin:reservation-created',
  RESERVATION_UPDATED: 'admin:reservation-updated',
  RESERVATION_STATUS_CHANGED: 'admin:reservation-status-changed',
  DASHBOARD_ANALYTICS_UPDATE: 'admin:dashboard-analytics-update',
  USER_CREATED: 'admin:user-created',
  USER_UPDATED: 'admin:user-updated',
  USER_STATUS_CHANGED: 'admin:user-status-changed',
  USER_ROLE_CHANGED: 'admin:user-role-changed',
  USER_VERIFIED: 'admin:user-verified',
  USER_DELETED: 'admin:user-deleted',
  DRIVER_CREATED: 'admin:driver-created',
  DRIVER_UPDATED: 'admin:driver-updated',
  DRIVER_STATUS_CHANGED: 'admin:driver-status-changed',
  DRIVER_DELETED: 'admin:driver-deleted',
  DRIVER_ASSIGNED: 'driver:assigned',
  TRIP_STARTED: 'trip:started',
  TRIP_ENDED: 'trip:ended',
  TRIP_DRIVER_CHANGED: 'trip:driver_changed',
  TRIP_VEHICLE_CHANGED: 'trip:vehicle_changed',
  LOCATION_UPDATE: 'location:update',
} as const;

/**
 * Socket event service implementation
 * Emits socket events for real-time notifications after REST API operations
 */
@injectable()
export class SocketEventService implements ISocketEventService {
  private io: Server | null = null;
  private chatSocketHandler: ChatSocketHandler | null = null;
  private notificationSocketHandler: NotificationSocketHandler | null = null;

  constructor() {
    // Service will be initialized with setIOServer, setChatSocketHandler, and setNotificationSocketHandler
    // These are called during server initialization in index.ts
  }

  /**
   * Sets the Socket.io server instance
   * Called during server initialization
   */
  setIOServer(io: Server): void {
    this.io = io;
  }

  /**
   * Sets the ChatSocketHandler instance
   * Used to check if users are online in chats
   */
  setChatSocketHandler(chatSocketHandler: ChatSocketHandler): void {
    this.chatSocketHandler = chatSocketHandler;
  }

  /**
   * Sets the NotificationSocketHandler instance
   * Used to check if users are globally online
   */
  setNotificationSocketHandler(notificationSocketHandler: NotificationSocketHandler): void {
    this.notificationSocketHandler = notificationSocketHandler;
  }

  /**
   * Emits message-sent event to sender and recipient
   * Checks if recipient is online and emits appropriate delivery status
   */
  async emitMessageSent(message: Message, senderId: string, chatId: string): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit message-sent event. ` +
        `Method: emitMessageSent, MessageId: ${message.messageId}, SenderId: ${senderId}, ChatId: ${chatId}. ` +
        `This should not happen if SocketEventService is properly initialized as singleton.`
      );
      return;
    }

    try {
      logger.debug(`[SocketEventService] Emitting message-sent event for message: ${message.messageId}, sender: ${senderId}, chat: ${chatId}`);

      const chatRepository = container.resolve<IChatRepository>(REPOSITORY_TOKENS.IChatRepository);
      const chat = await chatRepository.findById(chatId);

      if (!chat) {
        logger.warn(`Chat not found: ${chatId}, cannot emit message-sent event`);
        return;
      }

      // Find recipient
      const recipient = chat.getOtherParticipant(senderId);
      if (!recipient) {
        logger.warn(`Recipient not found for chat: ${chatId}, cannot emit message-sent event`);
        return;
      }

      // Get sender for notification title
      // Check both repositories since sender could be a user or driver
      // Try user repository first, then driver repository
      const userRepository = container.resolve<IUserRepository>(REPOSITORY_TOKENS.IUserRepository);
      let sender: { fullName: string } | null = await userRepository.findById(senderId);
      
      if (!sender) {
        // Sender not found in user repository, try driver repository
        const driverRepository = container.resolve<IDriverRepository>(REPOSITORY_TOKENS.IDriverRepository);
        sender = await driverRepository.findById(senderId);
      }

      if (!sender) {
        logger.warn(`Sender not found: ${senderId}, cannot create notification`);
      }

      // Emit to sender (confirmation) - both user room and chat room for real-time updates
      const senderUserRoom = `user:${senderId}`;
      const senderChatRoom = `chat:${chatId}`;
      
      // Convert entity to plain object for socket emission
      const messageData = {
        messageId: message.messageId,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        deliveryStatus: message.deliveryStatus,
        createdAt: message.createdAt,
        readAt: message.readAt,
        readBy: message.readBy,
      };
      
      this.io.to(senderUserRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_SENT, messageData);
      this.io.to(senderChatRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_SENT, messageData);

      // Check if recipient is globally online (connected to socket)
      const isRecipientOnline =
        this.notificationSocketHandler && (await this.notificationSocketHandler.isUserOnline(recipient.userId));

      // Check if recipient has joined the chat room
      const isRecipientInChat =
        this.chatSocketHandler && (await this.chatSocketHandler.isUserOnlineInChat(recipient.userId, chatId));

      const messageRepository = container.resolve<IMessageRepository>(REPOSITORY_TOKENS.IMessageRepository);

      if (isRecipientOnline && isRecipientInChat) {
        // Recipient is online AND has joined chat - mark as READ (double blue tick)
        // First update to DELIVERED if it's still SENT, then mark as READ
        if (message.deliveryStatus === MessageDeliveryStatus.SENT) {
          await messageRepository.updateDeliveryStatus(message.messageId, MessageDeliveryStatus.DELIVERED);
        }
        // Mark as read (updates status to READ, readAt, and readBy)
        await messageRepository.markAsRead(message.messageId, recipient.userId);

        this.io.to(senderChatRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_READ, {
          chatId: message.chatId,
          readBy: recipient.userId,
        });
      } else if (isRecipientOnline) {
        // Recipient is globally online but NOT in chat - mark as DELIVERED (double gray tick)
        await messageRepository.updateDeliveryStatus(message.messageId, MessageDeliveryStatus.DELIVERED);

        // Emit to recipient's user room and chat room (they're online, will receive it)
        const deliveredEvent = {
          messageId: message.messageId,
          chatId: message.chatId,
        };
        const recipientUserRoom = `user:${recipient.userId}`;
        
        this.io.to(recipientUserRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_DELIVERED, deliveredEvent);
        this.io.to(senderChatRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_DELIVERED, deliveredEvent);

        // Create notification since recipient is not actively viewing the chat
        if (sender && this.notificationSocketHandler) {
          try {
            const messagePreview = message.content.length > 100 
              ? message.content.substring(0, 100) + '...' 
              : message.content;
            
            const notificationRequest: CreateNotificationRequest = {
              userId: recipient.userId,
              type: NotificationType.CHAT_MESSAGE,
              title: `New message from ${sender.fullName}`,
              message: messagePreview,
              data: {
                chatId: message.chatId,
                messageId: message.messageId,
                senderId: senderId,
              },
            };

            await this.notificationSocketHandler.sendNotificationToUser(recipient.userId, notificationRequest);
            logger.debug(`Notification created for user: ${recipient.userId}, chat: ${chatId}`);
          } catch (notificationError) {
            // Don't fail message sending if notification creation fails
            logger.error(
              `Error creating notification for message: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
            );
          }
        }
      } else {
        // Recipient is offline - message stays as SENT (single tick)
        // No need to update database - message is already created with SENT status
        // Emit to recipient's user room (they'll receive it when they come online)
        // Also emit to chat room in case they're viewing but not globally online
        const recipientUserRoom = `user:${recipient.userId}`;
        
        // Convert entity to plain object for socket emission
        const messageData = {
          messageId: message.messageId,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          deliveryStatus: message.deliveryStatus,
          createdAt: message.createdAt,
          readAt: message.readAt,
          readBy: message.readBy,
        };
        
        this.io.to(recipientUserRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_SENT, messageData);
        this.io.to(senderChatRoom).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_SENT, messageData);

        // Create notification since recipient is offline
        if (sender && this.notificationSocketHandler) {
          try {
            const messagePreview = message.content.length > 100 
              ? message.content.substring(0, 100) + '...' 
              : message.content;
            
            const notificationRequest: CreateNotificationRequest = {
              userId: recipient.userId,
              type: NotificationType.CHAT_MESSAGE,
              title: `New message from ${sender.fullName}`,
              message: messagePreview,
              data: {
                chatId: message.chatId,
                messageId: message.messageId,
                senderId: senderId,
              },
            };

            await this.notificationSocketHandler.sendNotificationToUser(recipient.userId, notificationRequest);
            logger.debug(`Notification created for offline user: ${recipient.userId}, chat: ${chatId}`);
          } catch (notificationError) {
            // Don't fail message sending if notification creation fails
            logger.error(
              `Error creating notification for offline user: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
            );
          }
        }
      }
    } catch (error) {
      // Don't throw - socket emissions should not fail REST requests
      logger.error(
        `Error emitting message-sent event: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Emits message-read event to all participants in a chat
   */
  emitMessageRead(chatId: string, readBy: string): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit message-read event. ` +
        `Method: emitMessageRead, ChatId: ${chatId}, ReadBy: ${readBy}. ` +
        `This should not happen if SocketEventService is properly initialized as singleton.`
      );
      return;
    }

    try {
      // Emit to all participants in the chat room
      this.io.to(`chat:${chatId}`).emit(MESSAGE_SOCKET_EVENTS.MESSAGE_READ, {
        chatId,
        readBy,
      });

      logger.debug(`Message-read event emitted for chat: ${chatId} by user: ${readBy}`);
    } catch (error) {
      // Don't throw - socket emissions should not fail REST requests
      logger.error(`Error emitting message-read event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits chat-created event to creator and other participant
   */
  async emitChatCreated(chat: Chat, creatorId: string): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit chat-created event. ` +
        `Method: emitChatCreated, ChatId: ${chat.chatId}, CreatorId: ${creatorId}. ` +
        `This should not happen if SocketEventService is properly initialized as singleton.`
      );
      return;
    }

    try {
      // Convert entity to plain object for socket emission
      const chatData = {
        chatId: chat.chatId,
        contextType: chat.contextType,
        contextId: chat.contextId,
        participantType: chat.participantType,
        participants: chat.participants.map((p) => ({
          userId: p.userId,
          participantType: p.participantType,
        })),
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };

      // Emit to creator
      this.io.to(`user:${creatorId}`).emit(CHAT_SOCKET_EVENTS.CHAT_CREATED, chatData);

      // Find other participant
      const otherParticipant = chat.participants.find((p) => p.userId !== creatorId);
      if (otherParticipant) {
        // Check if other participant is online
        const isOtherParticipantOnline =
          this.chatSocketHandler &&
          (await this.chatSocketHandler.isUserOnlineInChat(otherParticipant.userId, chat.chatId));

        if (isOtherParticipantOnline) {
          // Emit to other participant
          this.io.to(`user:${otherParticipant.userId}`).emit(CHAT_SOCKET_EVENTS.CHAT_CREATED, chatData);
        }
      }

      logger.debug(`Chat-created event emitted for chat: ${chat.chatId} by user: ${creatorId}`);
    } catch (error) {
      // Don't throw - socket emissions should not fail REST requests
      logger.error(`Error emitting chat-created event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits unread count updates to a user
   */
  emitUnreadCountUpdate(userId: string, chatId: string, unreadCount: number, totalUnreadCount: number): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit unread count update. ` +
        `Method: emitUnreadCountUpdate, UserId: ${userId}, ChatId: ${chatId}. ` +
        `This should not happen if SocketEventService is properly initialized as singleton.`
      );
      return;
    }

    try {
      this.io.to(`user:${userId}`).emit('unread-count-updated', {
        chatId,
        unreadCount,
        totalUnreadCount,
      });

      logger.debug(`Unread count update emitted for user: ${userId}, chat: ${chatId}`);
    } catch (error) {
      logger.error(
        `Error emitting unread count update: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Emits quote created event to admin dashboard room
   */
  emitQuoteCreated(quote: Quote): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit quote created event. ` +
        `Method: emitQuoteCreated, QuoteId: ${quote.quoteId}.`
      );
      return;
    }

    try {
      const quoteData = {
        quoteId: quote.quoteId,
        userId: quote.userId,
        status: quote.status,
        createdAt: quote.createdAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.QUOTE_CREATED, quoteData);
      logger.debug(`Quote created event emitted to admin dashboard: ${quote.quoteId}`);
    } catch (error) {
      logger.error(`Error emitting quote created event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits quote updated event to admin dashboard room
   */
  emitQuoteUpdated(quote: Quote): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit quote updated event. ` +
        `Method: emitQuoteUpdated, QuoteId: ${quote.quoteId}.`
      );
      return;
    }

    try {
      const quoteData = {
        quoteId: quote.quoteId,
        userId: quote.userId,
        status: quote.status,
        updatedAt: quote.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.QUOTE_UPDATED, quoteData);
      logger.debug(`Quote updated event emitted to admin dashboard: ${quote.quoteId}`);
    } catch (error) {
      logger.error(`Error emitting quote updated event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits quote status changed event to admin dashboard room
   */
  emitQuoteStatusChanged(quote: Quote, oldStatus: QuoteStatus): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit quote status changed event. ` +
        `Method: emitQuoteStatusChanged, QuoteId: ${quote.quoteId}.`
      );
      return;
    }

    try {
      const quoteData = {
        quoteId: quote.quoteId,
        userId: quote.userId,
        oldStatus,
        newStatus: quote.status,
        updatedAt: quote.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.QUOTE_STATUS_CHANGED, quoteData);
      logger.debug(`Quote status changed event emitted to admin dashboard: ${quote.quoteId}, ${oldStatus} -> ${quote.status}`);
    } catch (error) {
      logger.error(`Error emitting quote status changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits quote expired event to admin dashboard and user rooms
   */
  async emitQuoteExpired(payload: { quoteId: string; expiredAt: Date }): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit quote expired event. ` +
        `Method: emitQuoteExpired, QuoteId: ${payload.quoteId}.`
      );
      return;
    }

    try {
      // Fetch quote to get userId
      const quoteRepository = container.resolve<IQuoteRepository>(REPOSITORY_TOKENS.IQuoteRepository);
      const quote = await quoteRepository.findById(payload.quoteId);

      const eventData = {
        quoteId: payload.quoteId,
        expiredAt: payload.expiredAt.toISOString(),
      };

      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit('quote:expired', eventData);
      
      // Emit to user room if quote exists
      if (quote) {
        const userRoom = `user:${quote.userId}`;
        this.io.to(userRoom).emit('quote:expired', eventData);
        logger.debug(`Quote expired event emitted to user room: ${userRoom}, quote: ${payload.quoteId}`);
      } else {
        // Fallback: emit globally if quote not found (shouldn't happen, but safe)
        this.io.emit('quote:expired', eventData);
        logger.warn(`Quote not found for expiry event, emitted globally: ${payload.quoteId}`);
      }
    } catch (error) {
      logger.error(`Error emitting quote expired event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits reservation created event to admin dashboard room
   */
  emitReservationCreated(reservation: Reservation): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit reservation created event. ` +
        `Method: emitReservationCreated, ReservationId: ${reservation.reservationId}.`
      );
      return;
    }

    try {
      const reservationData = {
        reservationId: reservation.reservationId,
        userId: reservation.userId,
        quoteId: reservation.quoteId,
        status: reservation.status,
        createdAt: reservation.createdAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.RESERVATION_CREATED, reservationData);
      logger.debug(`Reservation created event emitted to admin dashboard: ${reservation.reservationId}`);
    } catch (error) {
      logger.error(`Error emitting reservation created event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits reservation updated event to admin dashboard room
   */
  emitReservationUpdated(reservation: Reservation): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit reservation updated event. ` +
        `Method: emitReservationUpdated, ReservationId: ${reservation.reservationId}.`
      );
      return;
    }

    try {
      const reservationData = {
        reservationId: reservation.reservationId,
        userId: reservation.userId,
        status: reservation.status,
        updatedAt: reservation.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.RESERVATION_UPDATED, reservationData);
      logger.debug(`Reservation updated event emitted to admin dashboard: ${reservation.reservationId}`);
    } catch (error) {
      logger.error(`Error emitting reservation updated event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits reservation status changed event to admin dashboard room
   */
  emitReservationStatusChanged(reservation: Reservation, oldStatus: ReservationStatus): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit reservation status changed event. ` +
        `Method: emitReservationStatusChanged, ReservationId: ${reservation.reservationId}.`
      );
      return;
    }

    try {
      const reservationData = {
        reservationId: reservation.reservationId,
        userId: reservation.userId,
        oldStatus,
        newStatus: reservation.status,
        updatedAt: reservation.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.RESERVATION_STATUS_CHANGED, reservationData);
      logger.debug(`Reservation status changed event emitted to admin dashboard: ${reservation.reservationId}, ${oldStatus} -> ${reservation.status}`);
    } catch (error) {
      logger.error(`Error emitting reservation status changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits user created event to admin dashboard room
   */
  emitUserCreated(user: User): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit user created event. ` +
        `Method: emitUserCreated, UserId: ${user.userId}.`
      );
      return;
    }

    try {
      const userData = {
        userId: user.userId,
        email: user.email,
        status: user.status,
        role: user.role,
        createdAt: user.createdAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.USER_CREATED, userData);
      logger.debug(`User created event emitted to admin dashboard: ${user.userId}`);
    } catch (error) {
      logger.error(`Error emitting user created event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits user updated event to admin dashboard room
   */
  emitUserUpdated(user: User): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit user updated event. ` +
        `Method: emitUserUpdated, UserId: ${user.userId}.`
      );
      return;
    }

    try {
      const userData = {
        userId: user.userId,
        email: user.email,
        status: user.status,
        role: user.role,
        isVerified: user.isVerified,
        updatedAt: user.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.USER_UPDATED, userData);
      logger.debug(`User updated event emitted to admin dashboard: ${user.userId}`);
    } catch (error) {
      logger.error(`Error emitting user updated event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits user status changed event to admin dashboard room
   */
  emitUserStatusChanged(user: User, oldStatus: UserStatus): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit user status changed event. ` +
        `Method: emitUserStatusChanged, UserId: ${user.userId}.`
      );
      return;
    }

    try {
      const userData = {
        userId: user.userId,
        oldStatus,
        newStatus: user.status,
        updatedAt: user.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.USER_STATUS_CHANGED, userData);
      logger.debug(`User status changed event emitted to admin dashboard: ${user.userId}, ${oldStatus} -> ${user.status}`);
    } catch (error) {
      logger.error(`Error emitting user status changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits user role changed event to admin dashboard room
   */
  emitUserRoleChanged(user: User, oldRole: UserRole): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit user role changed event. ` +
        `Method: emitUserRoleChanged, UserId: ${user.userId}.`
      );
      return;
    }

    try {
      const userData = {
        userId: user.userId,
        oldRole,
        newRole: user.role,
        updatedAt: user.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.USER_ROLE_CHANGED, userData);
      logger.debug(`User role changed event emitted to admin dashboard: ${user.userId}, ${oldRole} -> ${user.role}`);
    } catch (error) {
      logger.error(`Error emitting user role changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits user verified event to admin dashboard room
   */
  emitUserVerified(userId: string): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit user verified event. ` +
        `Method: emitUserVerified, UserId: ${userId}.`
      );
      return;
    }

    try {
      const userData = {
        userId,
        verifiedAt: new Date().toISOString(),
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.USER_VERIFIED, userData);
      logger.debug(`User verified event emitted to admin dashboard: ${userId}`);
    } catch (error) {
      logger.error(`Error emitting user verified event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits user deleted event to admin dashboard room
   */
  emitUserDeleted(userId: string): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit user deleted event. ` +
        `Method: emitUserDeleted, UserId: ${userId}.`
      );
      return;
    }

    try {
      const userData = {
        userId,
        deletedAt: new Date().toISOString(),
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.USER_DELETED, userData);
      logger.debug(`User deleted event emitted to admin dashboard: ${userId}`);
    } catch (error) {
      logger.error(`Error emitting user deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits driver created event to admin dashboard room
   */
  emitDriverCreated(driver: Driver): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit driver created event. ` +
        `Method: emitDriverCreated, DriverId: ${driver.driverId}.`
      );
      return;
    }

    try {
      const driverData = {
        driverId: driver.driverId,
        fullName: driver.fullName,
        status: driver.status,
        createdAt: driver.createdAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.DRIVER_CREATED, driverData);
      logger.debug(`Driver created event emitted to admin dashboard: ${driver.driverId}`);
    } catch (error) {
      logger.error(`Error emitting driver created event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits driver updated event to admin dashboard room
   */
  emitDriverUpdated(driver: Driver): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit driver updated event. ` +
        `Method: emitDriverUpdated, DriverId: ${driver.driverId}.`
      );
      return;
    }

    try {
      const driverData = {
        driverId: driver.driverId,
        fullName: driver.fullName,
        status: driver.status,
        updatedAt: driver.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.DRIVER_UPDATED, driverData);
      logger.debug(`Driver updated event emitted to admin dashboard: ${driver.driverId}`);
    } catch (error) {
      logger.error(`Error emitting driver updated event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits driver status changed event to admin dashboard room
   */
  emitDriverStatusChanged(driver: Driver, oldStatus: DriverStatus): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit driver status changed event. ` +
        `Method: emitDriverStatusChanged, DriverId: ${driver.driverId}.`
      );
      return;
    }

    try {
      const driverData = {
        driverId: driver.driverId,
        oldStatus,
        newStatus: driver.status,
        updatedAt: driver.updatedAt,
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.DRIVER_STATUS_CHANGED, driverData);
      logger.debug(`Driver status changed event emitted to admin dashboard: ${driver.driverId}, ${oldStatus} -> ${driver.status}`);
    } catch (error) {
      logger.error(`Error emitting driver status changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits driver deleted event to admin dashboard room
   */
  emitDriverDeleted(driverId: string): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit driver deleted event. ` +
        `Method: emitDriverDeleted, DriverId: ${driverId}.`
      );
      return;
    }

    try {
      const driverData = {
        driverId,
        deletedAt: new Date().toISOString(),
      };

      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.DRIVER_DELETED, driverData);
      logger.debug(`Driver deleted event emitted to admin dashboard: ${driverId}`);
    } catch (error) {
      logger.error(`Error emitting driver deleted event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits driver assigned event to admin dashboard and user rooms
   */
  emitDriverAssigned(payload: {
    reservationId?: string;
    quoteId?: string;
    tripName: string;
    driverId: string;
    driverName: string;
    userId: string;
  }): void {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit driver assigned event. ` +
        `Method: emitDriverAssigned, DriverId: ${payload.driverId}.`
      );
      return;
    }

    try {
      const eventData = {
        reservationId: payload.reservationId,
        quoteId: payload.quoteId,
        tripName: payload.tripName,
        driverId: payload.driverId,
        driverName: payload.driverName,
        userId: payload.userId,
        assignedAt: new Date().toISOString(),
      };

      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.DRIVER_ASSIGNED, eventData);
      
      // Emit to user room
      this.io.to(`user:${payload.userId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.DRIVER_ASSIGNED, eventData);
      
      logger.debug(
        `Driver assigned event emitted: Driver ${payload.driverName} (${payload.driverId}) assigned to ${payload.tripName}`
      );
    } catch (error) {
      logger.error(`Error emitting driver assigned event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits trip started event to admin dashboard, user, and driver rooms
   */
  async emitTripStarted(reservationId: string, driverId: string): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit trip started event. ` +
        `Method: emitTripStarted, ReservationId: ${reservationId}, DriverId: ${driverId}.`
      );
      return;
    }

    try {
      // Fetch reservation to get userId for targeted user room emission
      const reservationRepository = container.resolve<IReservationRepository>(REPOSITORY_TOKENS.IReservationRepository);
      const reservation = await reservationRepository.findById(reservationId);
      
      const tripData = {
        reservationId,
        driverId,
        userId: reservation?.userId,
        startedAt: new Date().toISOString(),
      };

      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_STARTED, tripData);
      
      // Emit to driver room
      this.io.to(`driver:${driverId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_STARTED, tripData);
      
      // Emit to user room if reservation exists
      if (reservation?.userId) {
        this.io.to(`user:${reservation.userId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_STARTED, tripData);
      }
      
      logger.debug(`Trip started event emitted: reservation=${reservationId}, driver=${driverId}`);
    } catch (error) {
      logger.error(`Error emitting trip started event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits trip ended event to admin dashboard, user, and driver rooms
   */
  async emitTripEnded(reservationId: string, driverId: string): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit trip ended event. ` +
        `Method: emitTripEnded, ReservationId: ${reservationId}, DriverId: ${driverId}.`
      );
      return;
    }

    try {
      // Fetch reservation to get userId for targeted user room emission
      const reservationRepository = container.resolve<IReservationRepository>(REPOSITORY_TOKENS.IReservationRepository);
      const reservation = await reservationRepository.findById(reservationId);
      
      const tripData = {
        reservationId,
        driverId,
        userId: reservation?.userId,
        completedAt: new Date().toISOString(),
      };

      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_ENDED, tripData);
      
      // Emit to driver room
      this.io.to(`driver:${driverId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_ENDED, tripData);
      
      // Emit to user room if reservation exists
      if (reservation?.userId) {
        this.io.to(`user:${reservation.userId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_ENDED, tripData);
      }
      
      logger.debug(`Trip ended event emitted: reservation=${reservationId}, driver=${driverId}`);
    } catch (error) {
      logger.error(`Error emitting trip ended event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Emits driver changed event when admin changes driver for a reservation
   * Targets: old driver, new driver, and admin dashboard
   */
  emitDriverChanged(payload: {
    reservationId: string;
    oldDriverId: string | undefined;
    newDriverId: string;
    tripState: 'UPCOMING' | 'CURRENT' | 'PAST';
  }): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit driver changed event. ` +
        `Method: emitDriverChanged, ReservationId: ${payload.reservationId}.`
      );
      return Promise.resolve();
    }

    try {
      const eventData = {
        reservationId: payload.reservationId,
        oldDriverId: payload.oldDriverId,
        newDriverId: payload.newDriverId,
        tripState: payload.tripState,
        changedAt: new Date().toISOString(),
      };

      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_DRIVER_CHANGED, eventData);
      
      // Emit to old driver room (if exists) - so they know they lost the trip
      if (payload.oldDriverId) {
        this.io.to(`driver:${payload.oldDriverId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_DRIVER_CHANGED, eventData);
      }
      
      // Emit to new driver room - so they know they got the trip
      this.io.to(`driver:${payload.newDriverId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_DRIVER_CHANGED, eventData);
      
      logger.debug(
        `Driver changed event emitted: reservation=${payload.reservationId}, oldDriver=${payload.oldDriverId || 'none'} -> newDriver=${payload.newDriverId}, tripState=${payload.tripState}`
      );
    } catch (error) {
      logger.error(`Error emitting driver changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return Promise.resolve();
  }

  /**
   * Emits vehicle changed event when admin adjusts vehicles for a reservation
   * Targets: assigned driver (if any) and admin dashboard
   */
  emitVehicleChanged(payload: {
    reservationId: string;
    assignedDriverId: string | undefined;
    vehicles: Array<{
      vehicleId: string;
      quantity: number;
    }>;
  }): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit vehicle changed event. ` +
        `Method: emitVehicleChanged, ReservationId: ${payload.reservationId}.`
      );
      return Promise.resolve();
    }

    try {
      const eventData = {
        reservationId: payload.reservationId,
        vehicles: payload.vehicles,
        changedAt: new Date().toISOString(),
      };

      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_VEHICLE_CHANGED, eventData);
      
      // Emit to assigned driver room (if exists) - so they know about vehicle changes
      if (payload.assignedDriverId) {
        this.io.to(`driver:${payload.assignedDriverId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.TRIP_VEHICLE_CHANGED, eventData);
      }
      
      logger.debug(
        `Vehicle changed event emitted: reservation=${payload.reservationId}, driver=${payload.assignedDriverId || 'none'}, vehicleCount=${payload.vehicles.length}`
      );
    } catch (error) {
      logger.error(`Error emitting vehicle changed event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return Promise.resolve();
  }

  /**
   * Emits location update event to admin dashboard, user, and driver rooms
   */
  async emitLocationUpdate(locationData: {
    reservationId: string;
    driverId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: string;
  }): Promise<void> {
    if (!this.io) {
      logger.error(
        `[SocketEventService] Socket.io server not initialized, cannot emit location update event. ` +
        `Method: emitLocationUpdate, ReservationId: ${locationData.reservationId}, DriverId: ${locationData.driverId}.`
      );
      return;
    }

    try {
      // Fetch reservation to get userId for targeted user room emission
      const reservationRepository = container.resolve<IReservationRepository>(REPOSITORY_TOKENS.IReservationRepository);
      const reservation = await reservationRepository.findById(locationData.reservationId);
      
      // Emit to admin dashboard
      this.io.to('admin:dashboard').emit(ADMIN_DASHBOARD_SOCKET_EVENTS.LOCATION_UPDATE, locationData);
      
      // Emit to driver room
      this.io.to(`driver:${locationData.driverId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.LOCATION_UPDATE, locationData);
      
      // Emit to user room if reservation exists
      if (reservation?.userId) {
        this.io.to(`user:${reservation.userId}`).emit(ADMIN_DASHBOARD_SOCKET_EVENTS.LOCATION_UPDATE, locationData);
      }
      
      logger.debug(`Location update event emitted: reservation=${locationData.reservationId}, driver=${locationData.driverId}`);
    } catch (error) {
      logger.error(`Error emitting location update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async emitNotification(notification: {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    if (!this.notificationSocketHandler) {
      logger.warn('[SocketEventService] Notification socket handler not initialized');
      return;
    }
  
    try {
      // Check if user is online
      const isOnline = await this.notificationSocketHandler.isUserOnline(notification.userId);
      
      if (isOnline) {
        // User is online - emit socket event
        this.io?.to(`user:${notification.userId}`).emit(NOTIFICATION_SOCKET_EVENTS.NOTIFICATION_RECEIVED, {
          notificationId: notification.data?.notificationId as string,
          userId: notification.userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: false,
          createdAt: new Date(),
        });
        
        // Update unread count
        const getUnreadCountUseCase = container.resolve<IGetUnreadNotificationCountUseCase>(
          USE_CASE_TOKENS.GetUnreadNotificationCountUseCase
        );
        const unreadCount = await getUnreadCountUseCase.execute(notification.userId);
        this.io?.to(`user:${notification.userId}`).emit(NOTIFICATION_SOCKET_EVENTS.UNREAD_COUNT_UPDATED, unreadCount);
      } else {
        // User is offline (web client) - no push notification available
        // Notification is stored in DB, user will see it when they come back online
        logger.info(`User ${notification.userId} is offline (web client), notification stored in DB`);
      }
    } catch (error) {
      logger.error(`Error sending notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

