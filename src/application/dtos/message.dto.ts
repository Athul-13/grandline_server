import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { MessageDeliveryStatus } from '../../shared/constants';

/**
 * Request DTO for sending a message
 * Either chatId OR (contextType + contextId) must be provided
 * Validation for this requirement is handled in the use case
 */
export class SendMessageRequest {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  chatId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: SendMessageRequest) => !o.chatId)
  contextType?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: SendMessageRequest) => !o.chatId)
  contextId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000, { message: 'Message content cannot exceed 5000 characters' })
  content!: string;
}

/**
 * Response DTO for message information
 */
export interface MessageResponse {
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  deliveryStatus: MessageDeliveryStatus;
  createdAt: Date;
  readAt?: Date;
  readBy?: string;
}

/**
 * Response DTO for message list
 */
export interface MessageListResponse {
  messages: MessageResponse[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Request DTO for marking messages as read
 */
export class MarkMessageAsReadRequest {
  @IsString()
  @IsNotEmpty()
  chatId!: string;
}

/**
 * Response DTO for marking messages as read
 */
export interface MarkMessageAsReadResponse {
  message: string;
  unreadCount: number;
}

/**
 * Response DTO for unread message count
 */
export interface UnreadMessageCountResponse {
  chatId: string;
  unreadCount: number;
}

/**
 * Response DTO for total unread message count
 */
export interface TotalUnreadMessageCountResponse {
  totalUnreadCount: number;
}

/**
 * Request DTO for getting messages with pagination
 */
export class GetMessagesRequest {
  @IsString()
  @IsNotEmpty()
  chatId!: string;

  @IsOptional()
  @Min(1)
  page?: number;

  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}

