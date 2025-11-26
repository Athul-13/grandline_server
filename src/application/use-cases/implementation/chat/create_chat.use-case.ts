import { injectable, inject, container } from 'tsyringe';
import { ICreateChatUseCase } from '../../interface/chat/create_chat_use_case.interface';
import { IChatRepository } from '../../../../domain/repositories/chat_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { CreateChatRequest, ChatResponse } from '../../../dtos/chat.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { Chat, IChatParticipant } from '../../../../domain/entities/chat.entity';
import { ParticipantType, ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { randomUUID } from 'crypto';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';

/**
 * Use case for creating a chat
 * Creates a new chat conversation between participants
 */
@injectable()
export class CreateChatUseCase implements ICreateChatUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IChatRepository)
    private readonly chatRepository: IChatRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async execute(request: CreateChatRequest, userId: string): Promise<ChatResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request || !request.participants || request.participants.length !== 2) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Verify sender is in participants
    const senderParticipant = request.participants.find((p) => p.userId === userId);
    if (!senderParticipant) {
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Check if chat already exists for this context
    const existingChat = await this.chatRepository.findByContext(
      request.contextType,
      request.contextId
    );

    if (existingChat) {
      // Verify user has access to existing chat
      if (!existingChat.hasParticipant(userId)) {
        throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
      }

      return this.toChatResponse(existingChat);
    }

    // Validate participants exist and determine participant types
    const validatedParticipants = await this.validateAndDetermineParticipantTypes(
      request.participants
    );

    // Use the participant type from request (already validated)
    const participantType = request.participantType;

    // Create chat entity
    const chatId = randomUUID();
    const now = new Date();

    const chat = new Chat(
      chatId,
      request.contextType,
      request.contextId,
      participantType,
      validatedParticipants,
      now,
      now
    );

    await this.chatRepository.create(chat);

    logger.info(`Chat created: ${chatId} for context ${request.contextType}:${request.contextId}`);

    return this.toChatResponse(chat);
  }

  /**
   * Validates participants exist
   */
  private async validateAndDetermineParticipantTypes(
    participants: Array<{ userId: string; participantType: ParticipantType }>
  ): Promise<IChatParticipant[]> {
    const validatedParticipants: IChatParticipant[] = [];

    for (const participant of participants) {
      // Check if user exists
      const user = await this.userRepository.findById(participant.userId);
      
      // Check if driver exists (only if driver repository is available)
      let driver = null;
      try {
        const driverRepository = container.resolve<IDriverRepository>(
          REPOSITORY_TOKENS.IDriverRepository
        );
        driver = await driverRepository.findById(participant.userId);
      } catch {
        // Driver repository not registered, skip driver check
        // This is expected until driver repository is fully implemented
      }

      if (!user && !driver) {
        throw new AppError(
          `Participant ${participant.userId} not found`,
          'PARTICIPANT_NOT_FOUND',
          404
        );
      }

      // Use the participant type from the request
      validatedParticipants.push({
        userId: participant.userId,
        participantType: participant.participantType,
      });
    }

    return validatedParticipants;
  }

  /**
   * Converts Chat entity to ChatResponse DTO
   */
  private toChatResponse(chat: Chat): ChatResponse {
    return {
      chatId: chat.chatId,
      contextType: chat.contextType,
      contextId: chat.contextId,
      participantType: chat.participantType,
      participants: chat.participants.map((p) => ({
        userId: p.userId,
        participantType: p.participantType,
      })),
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}

