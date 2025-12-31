import { ActorType, TicketStatus, LinkedEntityType } from "../../shared/constants";

/**
 * Request DTO for adding a message
 */
export interface AddMessageRequest {
    ticketId: string;
    content: string;
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
 * Request DTO for creating a ticket
 */
export interface CreateTicketRequest {
    actorType: ActorType;
    actorId: string;
    subject: string;
    content: string; // First message content
    linkedEntityType?: LinkedEntityType | null;
    linkedEntityId?: string | null;
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
 * Request DTO for getting all tickets (admin)
 */
export interface GetAllTicketsRequest {
    page?: number;
    limit?: number;
    status?: TicketStatus;
    actorType?: ActorType;
    assignedAdminId?: string;
    sortBy?: 'lastMessageAt' | 'createdAt';
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
      subject: string;
      status: TicketStatus;
      priority: string;
      linkedEntityType: string | null;
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
 * Request DTO for getting messages
 */
export interface GetMessagesByTicketRequest {
    ticketId: string;
    page?: number;
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
    status: string;
    priority: string;
    linkedEntityType: string | null;
    linkedEntityId: string | null;
    assignedAdminId: string | null;
    lastMessageAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }

/**
 * Response DTO for ticket list
 */
export interface GetTicketsByActorResponse {
    tickets: Array<{
      ticketId: string;
      subject: string;
      status: string;
      priority: string;
      linkedEntityType: string | null;
      linkedEntityId: string | null;
      lastMessageAt: Date | null;
      createdAt: Date;
    }>;
  }
  