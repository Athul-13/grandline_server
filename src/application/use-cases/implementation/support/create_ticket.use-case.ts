import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { ITicketMessageRepository } from '../../../../domain/repositories/ticket_message_repository.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { Ticket } from '../../../../domain/entities/ticket.entity';
import { TicketMessage } from '../../../../domain/entities/ticket_message.entity';
import { ActorType, LinkedEntityType, TicketStatus, ERROR_MESSAGES, ERROR_CODES, NotificationType, UserRole } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';
import { CreateTicketRequest, CreateTicketResponse } from '../../../dtos/ticket.dto';
import { ICreateTicketUseCase } from '../../interface/support/create_ticket_use_case.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { INotificationService } from '../../../../domain/services/notification_service.interface';

/**
 * Use case for creating a support ticket
 * Creates a ticket with the first message
 */
@injectable()
export class CreateTicketUseCase implements ICreateTicketUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.ITicketMessageRepository)
    private readonly ticketMessageRepository: ITicketMessageRepository,
    @inject (SERVICE_TOKENS.INotificationService)
    private readonly notificationService: INotificationService,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(request: CreateTicketRequest, requesterId: string): Promise<CreateTicketResponse> {
    // Input validation
    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Validate actorType
    if (!request.actorType || !Object.values(ActorType).includes(request.actorType)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ACTOR_TYPE', 400);
    }

    // Validate actorId matches requester
    if (request.actorId !== requesterId) {
      logger.warn(`User ${requesterId} attempted to create ticket for actor ${request.actorId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Validate subject
    if (!request.subject || typeof request.subject !== 'string' || request.subject.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_SUBJECT', 400);
    }

    if (request.subject.trim().length > 200) {
      throw new AppError('Subject must be 200 characters or less', 'SUBJECT_TOO_LONG', 400);
    }

    // Validate content (first message)
    if (!request.content || typeof request.content !== 'string' || request.content.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CONTENT', 400);
    }

    if (request.content.trim().length > 10000) {
      throw new AppError('Message content must be 10000 characters or less', 'CONTENT_TOO_LONG', 400);
    }

    // Validate linkedEntityType and linkedEntityId consistency
    // Allow linkedEntityType without linkedEntityId (category-only tickets)
    // But require linkedEntityType if linkedEntityId is provided
    if (!request.linkedEntityType && request.linkedEntityId) {
      throw new AppError(
        'linkedEntityType is required when linkedEntityId is provided',
        'INVALID_LINKED_ENTITY',
        400
      );
    }

    // Validate linkedEntityType enum
    if (request.linkedEntityType && !Object.values(LinkedEntityType).includes(request.linkedEntityType)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_LINKED_ENTITY_TYPE', 400);
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const priority = request.priority || 'medium';
    if (!validPriorities.includes(priority)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_PRIORITY', 400);
    }

    // Create ticket entity
    const ticketId = randomUUID();
    const now = new Date();

    const ticket = new Ticket(
      ticketId,
      request.actorType,
      request.actorId,
      request.subject.trim(),
      request.linkedEntityType || null,
      request.linkedEntityId || null,
      TicketStatus.OPEN,
      priority,
      null, // assignedAdminId
      now, // lastMessageAt (set to now since we're creating first message)
      now, // createdAt
      now, // updatedAt
      false // isDeleted
    );

    // Create first message
    const messageId = randomUUID();
    const message = new TicketMessage(
      ticketId,
      messageId,
      request.actorType, // senderType matches actorType for first message
      request.actorId,
      request.content.trim(),
      now, // createdAt
      now, // updatedAt
      false // isDeleted
    );

    // Persist ticket and message
    await this.ticketRepository.create(ticket);
    await this.ticketMessageRepository.create(message);

    logger.info(`Ticket created: ${ticketId} by ${request.actorType}:${request.actorId}`);

    const admins = await this.userRepository.findByRole(UserRole.ADMIN);

    // Create notification for admins
    for (const admin of admins) {
      await this.notificationService.sendNotification({
        userId: admin.userId,
        type: NotificationType.TICKET_CREATED,
        title: `New ticket created: ${ticket.subject}`,
        message: `A new ticket has been created by ${request.actorType}`,
      });
      logger.info(`Notification sent to admin: ${admin.userId} for ticket: ${ticketId}`);
    }

    return {
      ticketId,
      actorType: ticket.actorType,
      actorId: ticket.actorId,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      linkedEntityType: ticket.linkedEntityType,
      linkedEntityId: ticket.linkedEntityId,
      createdAt: ticket.createdAt,
      messageId,
    };
  }
}

