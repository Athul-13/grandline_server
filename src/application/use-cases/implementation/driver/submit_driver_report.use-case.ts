import { inject, injectable } from 'tsyringe';
import { ISubmitDriverReportUseCase } from '../../interface/driver/submit_driver_report_use_case.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from '../../../../shared/constants';

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

  async execute(driverId: string, reservationId: string, reportContent: string): Promise<Reservation> {
    logger.info(`Submitting driver report: driver=${driverId}, reservation=${reservationId}`);

    // Validate report content
    if (!reportContent || typeof reportContent !== 'string') {
      throw new AppError(ERROR_MESSAGES.REPORT_CONTENT_REQUIRED, ERROR_CODES.INVALID_REQUEST, HTTP_STATUS.BAD_REQUEST);
    }

    const trimmedContent = reportContent.trim();
    if (trimmedContent.length === 0) {
      throw new AppError(ERROR_MESSAGES.REPORT_CONTENT_EMPTY, ERROR_CODES.INVALID_REQUEST, HTTP_STATUS.BAD_REQUEST);
    }

    if (trimmedContent.length > this.MAX_REPORT_LENGTH) {
      throw new AppError(
        `Report content cannot exceed ${this.MAX_REPORT_LENGTH} characters`,
        ERROR_CODES.INVALID_REQUEST,
        HTTP_STATUS.BAD_REQUEST
      );
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError(ERROR_MESSAGES.RESERVATION_NOT_FOUND, ERROR_CODES.RESERVATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    // Validate driver owns the reservation
    if (reservation.assignedDriverId !== driverId) {
      logger.warn(`Driver ${driverId} attempted to submit report for reservation ${reservationId} they don't own`);
      throw new AppError(ERROR_MESSAGES.UNAUTHORIZED_REPORT_SUBMISSION, ERROR_CODES.UNAUTHORIZED_REPORT_SUBMISSION, HTTP_STATUS.FORBIDDEN);
    }

    // Validate trip is completed
    if (!reservation.completedAt) {
      throw new AppError(ERROR_MESSAGES.TRIP_NOT_COMPLETED, ERROR_CODES.INVALID_REQUEST, HTTP_STATUS.BAD_REQUEST);
    }

    // Validate report doesn't already exist (immutable)
    if (reservation.driverReport) {
      throw new AppError(ERROR_MESSAGES.REPORT_ALREADY_SUBMITTED, ERROR_CODES.INVALID_REQUEST, HTTP_STATUS.BAD_REQUEST);
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
    
    await this.reservationRepository.updateById(reservationId, update);

    const updatedReservation = await this.reservationRepository.findById(reservationId);
    
    if (!updatedReservation) {
      throw new AppError(ERROR_MESSAGES.RESERVATION_NOT_FOUND, ERROR_CODES.RESERVATION_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
    }

    logger.info(`Driver report submitted successfully: driver=${driverId}, reservation=${reservationId}`);

    return updatedReservation;
  }
}

