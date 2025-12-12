import { injectable, inject } from 'tsyringe';
import { IGetReservationModificationsUseCase } from '../../../interface/admin/reservation/get_reservation_modifications_use_case.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { ReservationModification } from '../../../../../domain/entities/reservation_modification.entity';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';

/**
 * Use case for getting reservation modifications
 * Returns all modifications for a reservation
 */
@injectable()
export class GetReservationModificationsUseCase implements IGetReservationModificationsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository
  ) {}

  async execute(reservationId: string): Promise<ReservationModification[]> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch modifications
    const modifications = await this.modificationRepository.findByReservationId(reservationId);

    logger.info(`Retrieved ${modifications.length} modifications for reservation: ${reservationId}`);

    return modifications;
  }
}

