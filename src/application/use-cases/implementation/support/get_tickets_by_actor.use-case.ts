import { injectable, inject } from 'tsyringe';
import { ITicketRepository } from '../../../../domain/repositories/ticket_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ActorType, ERROR_MESSAGES, ERROR_CODES, LinkedEntityType } from '../../../../shared/constants';
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
    private readonly ticketRepository: ITicketRepository,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
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

    // Convert to response format and fetch linked entity numbers
    const ticketResponses = await Promise.all(
      tickets.map(async (ticket) => {
        let linkedEntityNumber: string | null = null;

        // Fetch quote or reservation number if linked entity exists
        if (ticket.linkedEntityType && ticket.linkedEntityId) {
          try {
            if (ticket.linkedEntityType === LinkedEntityType.QUOTE) {
              const quote = await this.quoteRepository.findById(ticket.linkedEntityId);
              if (quote) {
                linkedEntityNumber = quote.quoteNumber;
              }
            } else if (ticket.linkedEntityType === LinkedEntityType.RESERVATION) {
              const reservation = await this.reservationRepository.findById(ticket.linkedEntityId);
              if (reservation) {
                linkedEntityNumber = reservation.reservationNumber;
              }
            }
          } catch (error) {
            // Log error but don't fail the request if entity lookup fails
            logger.warn(`Failed to fetch linked entity number for ticket ${ticket.ticketId}:`, error);
          }
        }

        return {
          ticketId: ticket.ticketId,
          subject: ticket.subject,
          status: ticket.status,
          priority: ticket.priority,
          linkedEntityType: ticket.linkedEntityType,
          linkedEntityNumber,
          linkedEntityId: ticket.linkedEntityId,
          lastMessageAt: ticket.lastMessageAt,
          createdAt: ticket.createdAt,
        };
      })
    );

    return {
      tickets: ticketResponses,
    };
  }
}

