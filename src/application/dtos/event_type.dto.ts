import { IsNotEmpty, IsOptional, IsString, MinLength, MaxLength, Matches } from 'class-validator';

/**
 * Request DTO for creating custom event type
 */
export class CreateCustomEventTypeRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  @Matches(/.*\S.*/, {
    message: 'Event type name must contain at least one non-whitespace character',
  })
  name!: string;
}

/**
 * Response DTO for event type
 */
export interface EventTypeResponse {
  eventTypeId: string;
  name: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

