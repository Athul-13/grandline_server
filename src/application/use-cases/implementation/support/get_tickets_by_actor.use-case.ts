import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ActorType, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { GetTicketsByActorResponse } from '../../../dtos/ticket.dto';
import { IGetTicketsByActorUseCase } from '../../interface/support/get_ticket_by_actor_use_case.interface';

/**
 * Use case for getting tickets by actor
 * Returns all tickets for a specific user or driver
 */
@injectable()
export class GetTicketsByActorUseCase implements IGetTicketsByActorUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.ITicketRepository)
    private readonly ticketRepository: ITicketRepository
  ) {}

  async execute(actorType: ActorType, actorId: string, requesterId: string): Promise<GetTicketsByActorResponse> {
    // Input validation
    if (!requesterId || typeof requesterId !== 'string' || requesterId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUESTER_ID', 400);
    }

    if (!actorType || !Object.values(ActorType).includes(actorType)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ACTOR_TYPE', 400);
    }

    if (!actorId || typeof actorId !== 'string' || actorId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_ACTOR_ID', 400);
    }

    // Authorization: Requester must be the actor
    if (actorId !== requesterId) {
      logger.warn(`User ${requesterId} attempted to get tickets for actor ${actorId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Get tickets for actor
    const tickets = await this.ticketRepository.findByActor(actorType, actorId);

    // Convert to response format
    const ticketResponses = tickets.map((ticket) => ({
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      status: ticket.status,
      priority: ticket.priority,
      linkedEntityType: ticket.linkedEntityType,
      linkedEntityId: ticket.linkedEntityId,
      lastMessageAt: ticket.lastMessageAt,
      createdAt: ticket.createdAt,
    }));

    return {
      tickets: ticketResponses,
    };
  }
}

