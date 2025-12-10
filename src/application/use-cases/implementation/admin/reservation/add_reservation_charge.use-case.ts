import { injectable, inject } from 'tsyringe';
import { IAddReservationChargeUseCase } from '../../../interface/admin/reservation/add_reservation_charge_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IReservationChargeRepository } from '../../../../../domain/repositories/reservation_charge_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { ICreateNotificationUseCase } from '../../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, USE_CASE_TOKENS } from '../../../../di/tokens';
import { ReservationCharge } from '../../../../../domain/entities/reservation_charge.entity';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { NotificationType, ERROR_MESSAGES } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
import { randomUUID } from 'crypto';

/**
 * Use case for adding charge to reservation
 * Admin can add additional charges and notify user
 */
@injectable()
export class AddReservationChargeUseCase implements IAddReservationChargeUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
  ) {}

  async execute(
    reservationId: string,
    chargeType: ReservationCharge['chargeType'],
    description: string,
    amount: number,
    adminUserId: string,
    currency: string = 'INR'
  ): Promise<ReservationCharge> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_DESCRIPTION', 400);
    }

    if (!amount || amount <= 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_AMOUNT', 400);
    }

    // Fetch reservation
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Check if reservation can be modified
    if (!reservation.canBeModified()) {
      throw new AppError(
        'Reservation cannot be modified',
        'RESERVATION_NOT_MODIFIABLE',
        400
      );
    }

    // Create charge entity
    const chargeId = randomUUID();
    const now = new Date();
    const charge = new ReservationCharge(
      chargeId,
      reservationId,
      chargeType,
      description,
      amount,
      currency,
      adminUserId,
      false, // isPaid
      undefined, // paidAt
      now
    );

    await this.chargeRepository.create(charge);

    // Create modification record
    const modificationId = randomUUID();
    const modification = new ReservationModification(
      modificationId,
      reservationId,
      adminUserId,
      'charge_add',
      `Additional charge added: ${description} - ${amount} ${currency}`,
      undefined,
      amount.toString(),
      {
        chargeId,
        chargeType,
        description,
        amount,
        currency,
      }
    );
    await this.modificationRepository.create(modification);

    // Send notification to user
    try {
      await this.createNotificationUseCase.execute({
        userId: reservation.userId,
        type: NotificationType.RESERVATION_CHARGE_ADDED,
        title: 'Additional Charge Added',
        message: `An additional charge of ${amount} ${currency} has been added to your reservation: ${description}`,
        data: {
          reservationId,
          chargeId,
          chargeType,
          description,
          amount,
          currency,
        },
      });
    } catch (notificationError) {
      logger.error(
        `Failed to send notification for charge addition: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
      );
    }

    logger.info(
      `Admin added charge to reservation: ${reservationId}, charge: ${chargeId}, amount: ${amount} ${currency}`
    );

    return charge;
  }
}

