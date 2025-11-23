import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParticipantType } from '../../shared/constants';

/**
 * Chat participant structure for DTOs
 */
export class ChatParticipantDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(ParticipantType)
  participantType!: ParticipantType;
}

/**
 * Request DTO for creating a chat
 */
export class CreateChatRequest {
  @IsString()
  @IsNotEmpty()
  contextType!: string;

  @IsString()
  @IsNotEmpty()
  contextId!: string;

  @IsEnum(ParticipantType)
  participantType!: ParticipantType;

  @IsArray()
  @ArrayMinSize(2, { message: 'Chat must have exactly 2 participants' })
  @ArrayMaxSize(2, { message: 'Chat must have exactly 2 participants' })
  @ValidateNested({ each: true })
  @Type(() => ChatParticipantDto)
  participants!: ChatParticipantDto[];
}

/**
 * Response DTO for chat information
 */
export interface ChatResponse {
  chatId: string;
  contextType: string;
  contextId: string;
  participantType: ParticipantType;
  participants: Array<{
    userId: string;
    participantType: ParticipantType;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Response DTO for chat list
 */
export interface ChatListResponse {
  chats: ChatResponse[];
  total: number;
}

/**
 * Response DTO for getting chat by context
 */
export interface GetChatByContextResponse {
  chat: ChatResponse | null;
}

