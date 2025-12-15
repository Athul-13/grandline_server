import { Message } from '../entities/message.entity';
import { Chat } from '../entities/chat.entity';
import { Quote } from '../entities/quote.entity';
import { Reservation } from '../entities/reservation.entity';
import { QuoteStatus, ReservationStatus } from '../../shared/constants';

/**
 * Socket event service interface
 * Handles emitting socket events for real-time notifications
 */
export interface ISocketEventService {
  /**
   * Emits message-sent event to sender and recipient
   * Checks if recipient is online and emits appropriate delivery status
   */
  emitMessageSent(message: Message, senderId: string, chatId: string): Promise<void>;

  /**
   * Emits message-read event to all participants in a chat
   */
  emitMessageRead(chatId: string, readBy: string): void;

  /**
   * Emits chat-created event to creator and other participant
   */
  emitChatCreated(chat: Chat, creatorId: string): Promise<void>;

  /**
   * Emits unread count updates to a user
   */
  emitUnreadCountUpdate(userId: string, chatId: string, unreadCount: number, totalUnreadCount: number): void;

  /**
   * Emits quote created event to admin dashboard room
   */
  emitQuoteCreated(quote: Quote): void;

  /**
   * Emits quote updated event to admin dashboard room
   */
  emitQuoteUpdated(quote: Quote): void;

  /**
   * Emits quote status changed event to admin dashboard room
   */
  emitQuoteStatusChanged(quote: Quote, oldStatus: QuoteStatus): void;

  /**
   * Emits reservation created event to admin dashboard room
   */
  emitReservationCreated(reservation: Reservation): void;

  /**
   * Emits reservation updated event to admin dashboard room
   */
  emitReservationUpdated(reservation: Reservation): void;

  /**
   * Emits reservation status changed event to admin dashboard room
   */
  emitReservationStatusChanged(reservation: Reservation, oldStatus: ReservationStatus): void;
}

