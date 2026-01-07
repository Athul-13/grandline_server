import { inject, injectable } from 'tsyringe';
import { ISubmitDriverReportUseCase } from '../../interface/driver/submit_driver_report_use_case.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { ReservationEntity } from '../../../../domain/entities/reservation.entity';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { HTTP_STATUS } from '../../../../shared/constants';

/**
 * Use case for submitting driver trip report
 * Driver can submit a report after trip completion
 */
@injectable()
export class SubmitDriverReportUseCase implements ISubmitDriverReportUseCase {
  private readonly MAX_REPORT_LENGTH = 2000;

  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(driverId: string, reservationId: string, reportContent: string): Promise<ReservationEntity> {
    logger.info(`Submitting driver report: driver=${driverId}, reservation=${reservationId}`);

    // Validate report content
    if (!reportContent || typeof reportContent !== 'string') {
      throw new AppError('Report content is required', HTTP_STATUS.BAD_REQUEST);
    }

    const trimmedContent = reportContent.trim();
    if (trimmedContent.length === 0) {
      throw new AppError('Report content cannot be empty', HTTP_STATUS.BAD_REQUEST);
    }

    if (trimmedContent.length > this.MAX_REPORT_LENGTH) {
      throw new AppError(
        `Report content cannot exceed ${this.MAX_REPORT_LENGTH} characters`,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError('Reservation not found', HTTP_STATUS.NOT_FOUND);
    }

    // Validate driver owns the reservation
    if (reservation.assignedDriverId !== driverId) {
      logger.warn(`Driver ${driverId} attempted to submit report for reservation ${reservationId} they don't own`);
      throw new AppError('Unauthorized: You can only submit reports for your own trips', HTTP_STATUS.FORBIDDEN);
    }

    // Validate trip is completed
    if (!reservation.completedAt) {
      throw new AppError('Trip must be completed before submitting a report', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate report doesn't already exist (immutable)
    if (reservation.driverReport) {
      throw new AppError('Report has already been submitted and cannot be modified', HTTP_STATUS.BAD_REQUEST);
    }

    // Update reservation with driver report
    const now = new Date();
    const update: Partial<import('../../../../infrastructure/database/mongodb/models/reservation.model').IReservationModel> =
      {
        driverReport: {
          content: trimmedContent,
          submittedAt: now,
        },
      };

    const updatedReservation = await this.reservationRepository.updateById(reservationId, update);

    logger.info(`Driver report submitted successfully: driver=${driverId}, reservation=${reservationId}`);

    return updatedReservation;
  }
}

