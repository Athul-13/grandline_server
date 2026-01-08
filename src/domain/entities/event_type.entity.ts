/**
 * EventType domain entity representing an event type
 * Contains core business logic and validation rules
 */
export class EventType {
  constructor(
    public readonly eventTypeId: string,
    public readonly name: string,
    public readonly isCustom: boolean,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly createdBy?: string
  ) {}

  /**
   * Checks if this is a predefined event type
   */
  isPredefined(): boolean {
    return !this.isCustom;
  }

  /**
   * Checks if the event type can be used
   */
  canBeUsed(): boolean {
    return this.isActive;
  }
}

