import { injectable, inject } from 'tsyringe';
import { IDeleteDriverUseCase } from '../../interface/driver/delete_driver_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, SUCCESS_MESSAGES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for deleting a driver (admin)
 * Soft deletes driver account (sets isDeleted: true)
 */
@injectable()
export class DeleteDriverUseCase implements IDeleteDriverUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
  ) {}

  async execute(driverId: string): Promise<{ message: string }> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    // Check if driver exists
    const existingDriver = await this.driverRepository.findById(driverId);
    if (!existingDriver) {
      logger.warn(`Admin attempt to delete non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

    // Soft delete driver
    await this.driverRepository.softDelete(driverId);

    // Emit socket event for admin dashboard
    try {
      const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
      socketEventService.emitDriverDeleted(driverId);
    } catch (error) {
      // Don't fail driver deletion if socket emission fails
      logger.error('Error emitting driver deleted event:', error);
    }

    logger.info(`Driver deleted successfully (soft delete): ${existingDriver.email} (${driverId})`);

    return {
      message: SUCCESS_MESSAGES.DRIVER_DELETED,
    };
  }
}

