import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsIn,
  MaxLength,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { ActorType, TicketStatus, LinkedEntityType } from '../../shared/constants';

/**
 * Request DTO for creating a ticket
 * Validates input data before processing
 */
export class CreateTicketRequest {
  @IsEnum(ActorType, { message: 'actorType must be one of: user, driver' })
  @IsNotEmpty()
  actorType!: ActorType;

  @IsString()
  @IsNotEmpty()
  actorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200, { message: 'Subject must be 200 characters or less' })
  subject!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Message content must be 10000 characters or less' })
  content!: string;

  @IsOptional()
  @IsEnum(LinkedEntityType, { message: 'linkedEntityType must be one of: quote, reservation' })
  linkedEntityType?: LinkedEntityType | null;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o: CreateTicketRequest) => o.linkedEntityType !== undefined && o.linkedEntityType !== null)
  linkedEntityId?: string | null;

  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high', 'urgent'], { message: 'Priority must be one of: low, medium, high, urgent' })
  priority?: string;
}

/**
 * Response DTO for created ticket
 */
export interface CreateTicketResponse {
  ticketId: string;
  actorType: ActorType;
  actorId: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  linkedEntityType: LinkedEntityType | null;
  linkedEntityId: string | null;
  createdAt: Date;
  messageId: string;
}

/**
 * Request DTO for adding a message to a ticket
 * Validates input data before processing
 */
export class AddMessageRequest {
  ticketId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10000, { message: 'Message content must be 10000 characters or less' })
  content!: string;
}

/**
 * Response DTO for added message
 */
export interface AddMessageResponse {
  messageId: string;
  ticketId: string;
  senderType: ActorType;
  senderId: string;
  content: string;
  createdAt: Date;
}

/**
 * Request DTO for getting all tickets (admin)
 * Validates input data before processing
 */
export class GetAllTicketsRequest {
  @IsOptional()
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number;

  @IsOptional()
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit must be 100 or less' })
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Search query must be 200 characters or less' })
  search?: string;

  @IsOptional()
  @IsEnum(TicketStatus, { message: 'Status must be one of: open, in_progress, resolved, rejected' })
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(ActorType, { message: 'actorType must be one of: user, driver, admin' })
  actorType?: ActorType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assignedAdminId?: string;

  @IsOptional()
  @IsString()
  @IsIn(['lastMessageAt', 'createdAt'], { message: 'sortBy must be one of: lastMessageAt, createdAt' })
  sortBy?: 'lastMessageAt' | 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'], { message: 'sortOrder must be one of: asc, desc' })
  sortOrder?: 'asc' | 'desc';
}

/**
 * Response DTO for ticket list (admin)
 */
export interface GetAllTicketsResponse {
  tickets: Array<{
    ticketId: string;
    actorType: ActorType;
    actorId: string;
    actorName: string; // Full name of user or driver
    subject: string;
    status: TicketStatus;
    priority: string;
    linkedEntityType: LinkedEntityType | null;
    linkedEntityId: string | null;
    assignedAdminId: string | null;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Request DTO for getting messages by ticket
 * Note: ticketId comes from URL params, not validated here
 * This DTO validates query parameters (page, limit)
 */
export class GetMessagesByTicketRequest {
  ticketId!: string; // Set from URL params in controller, not validated

  @IsOptional()
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number;

  @IsOptional()
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit must be 100 or less' })
  limit?: number;
}

/**
 * Response DTO for message list
 */
export interface GetMessagesByTicketResponse {
  messages: Array<{
    messageId: string;
    ticketId: string;
    senderType: ActorType;
    senderId: string;
    content: string;
    createdAt: Date;
  }>;
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Response DTO for ticket details
 */
export interface GetTicketByIdResponse {
  ticketId: string;
  actorType: ActorType;
  actorId: string;
  subject: string;
  status: TicketStatus;
  priority: string;
  linkedEntityType: LinkedEntityType | null;
  linkedEntityId: string | null;
  linkedEntityNumber: string | null;
  assignedAdminId: string | null;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for ticket list (by actor)
 */
export interface GetTicketsByActorResponse {
  tickets: Array<{
    ticketId: string;
    subject: string;
    status: TicketStatus;
    priority: string;
    linkedEntityType: LinkedEntityType | null;
    linkedEntityNumber: string | null;
    linkedEntityId: string | null;
    lastMessageAt: Date | null;
    createdAt: Date;
  }>;
}

/**
 * Request DTO for updating ticket status
 * Validates input data before processing
 */
export class UpdateTicketStatusRequest {
  @IsEnum(TicketStatus, { message: 'Status must be one of: open, in_progress, resolved, rejected' })
  @IsNotEmpty()
  status!: TicketStatus;
}

/**
 * Request DTO for assigning ticket to admin
 * Validates input data before processing
 */
export class AssignTicketToAdminRequest {
  @IsString()
  @IsNotEmpty()
  adminId!: string;
}
