/**
 * Use case interface for marking chat notifications as read
 */
export interface IMarkChatNotificationsAsReadUseCase {
  execute(userId: string, chatId: string): Promise<void>;
}

