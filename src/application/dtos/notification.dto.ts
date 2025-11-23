import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { NotificationType } from '../../shared/constants';

/**
 * Request DTO for creating a notification
 */
export class CreateNotificationRequest {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationType)
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Notification title cannot exceed 200 characters' })
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000, { message: 'Notification message cannot exceed 1000 characters' })
  message!: string;

  @IsOptional()
  data?: Record<string, unknown>;
}

/**
 * Response DTO for notification information
 */
export interface NotificationResponse {
  notificationId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: Date;
}

/**
 * Response DTO for notification list
 */
export interface NotificationListResponse {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  unreadCount: number;
}

/**
 * Request DTO for getting notifications with pagination
 */
export class GetNotificationsRequest {
  @IsOptional()
  @Min(1)
  page?: number;

  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

/**
 * Request DTO for marking notification as read
 */
export class MarkNotificationAsReadRequest {
  @IsString()
  @IsNotEmpty()
  notificationId!: string;
}

/**
 * Response DTO for marking notification as read
 */
export interface MarkNotificationAsReadResponse {
  message: string;
  notification: NotificationResponse;
}

/**
 * Response DTO for marking all notifications as read
 */
export interface MarkAllNotificationsAsReadResponse {
  message: string;
  markedCount: number;
}

/**
 * Response DTO for unread notification count
 */
export interface UnreadNotificationCountResponse {
  unreadCount: number;
}

