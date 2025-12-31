import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { ITicketMessageRepository } from '../../../../domain/repositories/ticket_message_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { TicketMessage } from '../../../../domain/entities/ticket_message.entity';
import { ActorType, UserRole, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { AddMessageRequest, AddMessageResponse } from '../../../dtos/ticket.dto';
import { IAddMessageUseCase } from '../../interface/support/add_message_use_case.interface';


/**
 * Use case for adding a message to a ticket
 * Validates sender authorization and updates ticket's lastMessageAt
 */
@injectable()
export class AddMessageUseCase implements IAddMessageUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.ITicketMessageRepository)
    private readonly ticketMessageRepository: ITicketMessageRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: AddMessageRequest, senderId: string): Promise<AddMessageResponse> {
    // Input validation
    if (!senderId || typeof senderId !== 'string' || senderId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_SENDER_ID', 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    if (!request.ticketId || typeof request.ticketId !== 'string' || request.ticketId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_TICKET_ID', 400);
    }

    if (!request.content || typeof request.content !== 'string' || request.content.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CONTENT', 400);
    }

    if (request.content.trim().length > 10000) {
      throw new AppError('Message content must be 10000 characters or less', 'CONTENT_TOO_LONG', 400);
    }

    // Get ticket
    const ticket = await this.ticketRepository.findById(request.ticketId);

    if (!ticket) {
      logger.warn(`Attempt to add message to non-existent ticket: ${request.ticketId}`);
      throw new AppError('Ticket not found', 'TICKET_NOT_FOUND', 404);
    }

    // Check if requester is admin
    const requesterUser = await this.userRepository.findById(senderId);
    const isAdmin = requesterUser?.role === UserRole.ADMIN;

    // Determine sender type
    let senderType: ActorType;
    if (isAdmin) {
      senderType = ActorType.ADMIN;
    } else if (ticket.actorType === ActorType.USER && ticket.actorId === senderId) {
      senderType = ActorType.USER;
    } else if (ticket.actorType === ActorType.DRIVER && ticket.actorId === senderId) {
      senderType = ActorType.DRIVER;
    } else {
      // Sender is not the ticket actor and not an admin
      logger.warn(`User ${senderId} attempted to add message to ticket ${request.ticketId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Validate sender: must be ticket actor OR admin
    // (Already validated above, but explicit check for clarity)
    if (!isAdmin && !ticket.isActor(senderId)) {
      logger.warn(`User ${senderId} attempted to add message to ticket ${request.ticketId} without permission`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Create message entity
    const messageId = randomUUID();
    const now = new Date();

    const message = new TicketMessage(
      request.ticketId,
      messageId,
      senderType,
      senderId,
      request.content.trim(),
      now, // createdAt
      now, // updatedAt
      false // isDeleted
    );

    // Persist message
    await this.ticketMessageRepository.create(message);

    // Update ticket's lastMessageAt
    // Cast to Partial<Ticket> for repository method (readonly properties are handled at entity level)
    await this.ticketRepository.updateById(request.ticketId, {
      lastMessageAt: now,
    } as Partial<Ticket>);

    logger.info(`Message added: ${messageId} to ticket: ${request.ticketId} by ${senderType}:${senderId}`);

    return {
      messageId,
      ticketId: message.ticketId,
      senderType: message.senderType,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
    };
  }
}

