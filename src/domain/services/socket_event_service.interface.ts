import { Message } from '../entities/message.entity';
import { Chat } from '../entities/chat.entity';
import { Quote } from '../entities/quote.entity';
import { Reservation } from '../entities/reservation.entity';
import { User } from '../entities/user.entity';
import { Driver } from '../entities/driver.entity';
import { QuoteStatus, ReservationStatus, UserStatus, UserRole, DriverStatus } from '../../shared/constants';

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

  /**
   * Emits user created event to admin dashboard room
   */
  emitUserCreated(user: User): void;

  /**
   * Emits user updated event to admin dashboard room
   */
  emitUserUpdated(user: User): void;

  /**
   * Emits user status changed event to admin dashboard room
   */
  emitUserStatusChanged(user: User, oldStatus: UserStatus): void;

  /**
   * Emits user role changed event to admin dashboard room
   */
  emitUserRoleChanged(user: User, oldRole: UserRole): void;

  /**
   * Emits user verified event to admin dashboard room
   */
  emitUserVerified(userId: string): void;

  /**
   * Emits user deleted event to admin dashboard room
   */
  emitUserDeleted(userId: string): void;

  /**
   * Emits driver created event to admin dashboard room
   */
  emitDriverCreated(driver: Driver): void;

  /**
   * Emits driver updated event to admin dashboard room
   */
  emitDriverUpdated(driver: Driver): void;

  /**
   * Emits driver status changed event to admin dashboard room
   */
  emitDriverStatusChanged(driver: Driver, oldStatus: DriverStatus): void;

  /**
   * Emits driver deleted event to admin dashboard room
   */
  emitDriverDeleted(driverId: string): void;

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
  }): void;

  /**
   * Emits trip started event to admin dashboard, user, and driver rooms
   */
  emitTripStarted(reservationId: string, driverId: string): Promise<void>;

  /**
   * Emits trip ended event to admin dashboard, user, and driver rooms
   */
  emitTripEnded(reservationId: string, driverId: string): Promise<void>;

  /**
   * Emits driver changed event when admin changes driver for a reservation
   * Targets: old driver, new driver, and admin dashboard
   */
  emitDriverChanged(payload: {
    reservationId: string;
    oldDriverId: string | undefined;
    newDriverId: string;
    tripState: 'UPCOMING' | 'CURRENT' | 'PAST';
  }): Promise<void>;

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
  }): Promise<void>;

  /**
   * Emits location update event to admin dashboard, user, and driver rooms
   */
  emitLocationUpdate(locationData: {
    reservationId: string;
    driverId: string;
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
    timestamp: string;
  }): Promise<void>;
}

