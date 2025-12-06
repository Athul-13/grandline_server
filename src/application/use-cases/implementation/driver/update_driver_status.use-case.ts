import { injectable, inject } from 'tsyringe';
import { IUpdateDriverStatusUseCase } from '../../interface/driver/update_driver_status_use_case.interface';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IQueueService } from '../../../../domain/services/queue_service.interface';
import { UpdateDriverStatusRequest, UpdateDriverStatusResponse } from '../../../dtos/driver.dto';
import { REPOSITORY_TOKENS, SERVICE_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES, ERROR_CODES, DriverStatus } from '../../../../shared/constants';
import { DriverMapper } from '../../../mapper/driver.mapper';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';

/**
 * Use case for updating driver status (admin)
 * Updates driver status: AVAILABLE, ON_TRIP, OFFLINE, SUSPENDED, BLOCKED
 */
@injectable()
export class UpdateDriverStatusUseCase implements IUpdateDriverStatusUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(SERVICE_TOKENS.IQueueService)
    private readonly queueService: IQueueService
  ) {}

  async execute(driverId: string, request: UpdateDriverStatusRequest): Promise<UpdateDriverStatusResponse> {
    // Input validation
    if (!driverId || typeof driverId !== 'string' || driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    if (!request || !request.status) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Validate status value
    if (!Object.values(DriverStatus).includes(request.status)) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    // Check if driver exists
    const existingDriver = await this.driverRepository.findById(driverId);
    if (!existingDriver) {
      logger.warn(`Admin attempt to update status for non-existent driver: ${driverId}`);
      throw new AppError(ERROR_MESSAGES.DRIVER_NOT_FOUND, ERROR_CODES.DRIVER_NOT_FOUND, 404);
    }

      // Update driver status
      const updatedDriver = await this.driverRepository.updateDriverStatus(driverId, request.status);

      logger.info(`Driver status updated successfully: ${updatedDriver.email} (${driverId}) - Status: ${request.status}`);

      // If driver status changed to AVAILABLE and driver is onboarded, trigger pending quotes job
      if (request.status === DriverStatus.AVAILABLE && updatedDriver.isOnboarded) {
        try {
          await this.queueService.addProcessPendingQuotesJob();
          logger.info(`Driver ${driverId} became available and onboarded, triggered pending quotes job`);
        } catch (error) {
          logger.warn(
            `Failed to trigger pending quotes job after driver ${driverId} status change: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
          // Don't fail status update if queue job fails
        }
      }

      return DriverMapper.toUpdateDriverStatusResponse(updatedDriver);
  }
}

