import { injectable, inject } from 'tsyringe';
import { IDriverRepository } from '../../../../domain/repositories/driver_repository.interface';
import { IDriverPaymentRepository } from '../../../../domain/repositories/driver_payment_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { DriverPayment } from '../../../../domain/entities/driver_payment.entity';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { v4 as uuidv4 } from 'uuid';
import { ICalculateDriverEarningsUseCase } from '../../interface/driver/calculate_driver_earnings_use_case.interface';

/**
 * Use case for calculating driver earnings when a trip is completed
 * Creates a driver payment record and increments driver's total earnings
 */
@injectable()
export class CalculateDriverEarningsUseCase implements ICalculateDriverEarningsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverRepository)
    private readonly driverRepository: IDriverRepository,
    @inject(REPOSITORY_TOKENS.IDriverPaymentRepository)
    private readonly driverPaymentRepository: IDriverPaymentRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository
  ) {}

  async execute(reservationId: string): Promise<void> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_REQUEST, 400);
    }

    logger.info(`Calculating driver earnings for reservation: ${reservationId}`);

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);
    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Check if reservation has assigned driver
    if (!reservation.assignedDriverId) {
      logger.warn(`Reservation ${reservationId} has no assigned driver, skipping earnings calculation`);
      return;
    }

    // Check if reservation is completed
    if (!reservation.completedAt) {
      logger.warn(`Reservation ${reservationId} is not completed yet, skipping earnings calculation`);
      return;
    }

    // Check if payment already exists for this reservation
    const existingPayments = await this.driverPaymentRepository.findDriverPaymentsByReservationId(reservationId);
    if (existingPayments.length > 0) {
      logger.warn(`Driver payment already exists for reservation ${reservationId}, skipping calculation`);
      return;
    }

    // Fetch quote to get driver charge from pricing breakdown
    const quote = await this.quoteRepository.findById(reservation.quoteId);
    if (!quote) {
      throw new AppError('Quote not found', 'QUOTE_NOT_FOUND', 404);
    }

    // Get driver charge from quote pricing breakdown
    const earningsAmount = quote.pricing?.driverCharge ?? 0;

    if (earningsAmount <= 0) {
      logger.warn(
        `Quote ${reservation.quoteId} has zero or negative driver charge, skipping earnings calculation for reservation ${reservationId}`
      );
      return;
    }

    // Create driver payment record
    const now = new Date();
    const paymentId = uuidv4();
    const driverPayment = new DriverPayment(
      paymentId,
      reservation.assignedDriverId,
      reservationId,
      earningsAmount,
      now,
      now
    );

    // Save driver payment record
    await this.driverPaymentRepository.createDriverPayment(driverPayment);

    // Atomically increment driver's total earnings
    await this.driverRepository.incrementTotalEarnings(reservation.assignedDriverId, earningsAmount);

    logger.info(
      `Driver earnings calculated: ${earningsAmount} for driver ${reservation.assignedDriverId} from reservation ${reservationId}`
    );
  }
}

