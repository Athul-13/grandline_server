import { inject, injectable } from "tsyringe";
import { INotificationService } from "../../domain/services/notification_service.interface";
import { SERVICE_TOKENS, USE_CASE_TOKENS } from "../../application/di/tokens";
import { ISocketEventService } from "../../domain/services/socket_event_service.interface";
import { ICreateNotificationUseCase } from "../../application/use-cases/interface/notification/create_notification_use_case.interface";
import { NotificationType } from "../../shared/constants";
import { logger } from "../../shared/logger";

@injectable()
export class NotificationService implements INotificationService {
    constructor(
        @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
        private readonly createNotificationUseCase: ICreateNotificationUseCase,
        @inject(SERVICE_TOKENS.ISocketEventService)
        private readonly socketEventService: ISocketEventService
    ) {}

    async sendNotification(notification: {
        userId: string;
        type: NotificationType;
        title: string;
        message: string;
        data?: Record<string, unknown>;
    }): Promise<void> {
        try {
            // Step 1: Create notification in database (via use case)
            const createdNotification = await this.createNotificationUseCase.execute({
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: notification.data,
            });

            // Step 2: Send real-time notification (socket event)
            await this.socketEventService.emitNotification({
                userId: notification.userId,
                type: notification.type,
                title: notification.title,
                message: notification.message,
                data: {
                    ...notification.data,
                    notificationId: createdNotification.notificationId, // Include the ID for socket event
                },
            });

            logger.info(`Notification sent: ${createdNotification.notificationId} to user: ${notification.userId}`);
        } catch (error) {
            logger.error(
                `Error sending notification to user ${notification.userId}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
            // Don't throw - notification failures shouldn't break business operations
        }
    }
}