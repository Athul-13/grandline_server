import { injectable, inject } from 'tsyringe';
import { IGetUnreadNotificationCountUseCase } from '../../interface/notification/get_unread_notification_count_use_case.interface';
import { INotificationRepository } from '../../../../domain/repositories/notification_repository.interface';
import { UnreadNotificationCountResponse } from '../../../dtos/notification.dto';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for getting unread notification count
 */
@injectable()
export class GetUnreadNotificationCountUseCase implements IGetUnreadNotificationCountUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.INotificationRepository)
    private readonly notificationRepository: INotificationRepository
  ) {}

  async execute(userId: string): Promise<UnreadNotificationCountResponse> {
    // Input validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    const unreadCount = await this.notificationRepository.getUnreadCount(userId);

    return {
      unreadCount,
    };
  }
}

