import { injectable, inject } from 'tsyringe';
import { IGetAdminReservationUseCase } from '../../../interface/admin/reservation/get_admin_reservation_use_case.interface';
import { IReservationRepository } from '../../../../../domain/repositories/reservation_repository.interface';
import { IUserRepository } from '../../../../../domain/repositories/user_repository.interface';
import { IReservationItineraryRepository } from '../../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IReservationModificationRepository } from '../../../../../domain/repositories/reservation_modification_repository.interface';
import { IReservationChargeRepository } from '../../../../../domain/repositories/reservation_charge_repository.interface';
import { IPassengerRepository } from '../../../../../domain/repositories/passenger_repository.interface';
import { AdminReservationDetailsResponse, ReservationModificationResponse, ReservationChargeResponse } from '../../../../dtos/reservation.dto';
import { REPOSITORY_TOKENS } from '../../../../di/tokens';
import { ReservationMapper } from '../../../../mapper/reservation.mapper';
import { ERROR_MESSAGES } from '../../../../../shared/constants';
import { logger } from '../../../../../shared/logger';
import { AppError } from '../../../../../shared/utils/app_error.util';

/**
 * Use case for getting admin reservation details
 * Retrieves a single reservation by ID with user information and related data
 */
@injectable()
export class GetAdminReservationUseCase implements IGetAdminReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly itineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IReservationModificationRepository)
    private readonly modificationRepository: IReservationModificationRepository,
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository
  ) {}

  async execute(reservationId: string): Promise<AdminReservationDetailsResponse> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Fetch reservation (no ownership check for admin)
    const reservation = await this.reservationRepository.findById(reservationId);

    if (!reservation) {
      logger.warn(`Admin attempted to get non-existent reservation: ${reservationId}`);
      throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
    }

    // Fetch user information
    const user = await this.userRepository.findById(reservation.userId);
    if (!user) {
      logger.error(`User not found for reservation: ${reservationId}, userId: ${reservation.userId}`);
      throw new AppError('User not found', 'USER_NOT_FOUND', 404);
    }

    // Fetch related data
    const [modifications, charges] = await Promise.all([
      this.modificationRepository.findByReservationId(reservationId),
      this.chargeRepository.findByReservationId(reservationId),
    ]);

    // Map to response DTO
    const reservationResponse = ReservationMapper.toReservationResponse(reservation);

    // Map modifications
    const modificationResponses: ReservationModificationResponse[] = modifications.map((mod) => ({
      modificationId: mod.modificationId,
      reservationId: mod.reservationId,
      modifiedBy: mod.modifiedBy,
      modificationType: mod.modificationType,
      description: mod.description,
      previousValue: mod.previousValue,
      newValue: mod.newValue,
      metadata: mod.metadata,
      createdAt: mod.createdAt,
    }));

    // Map charges
    const chargeResponses: ReservationChargeResponse[] = charges.map((charge) => ({
      chargeId: charge.chargeId,
      reservationId: charge.reservationId,
      chargeType: charge.chargeType,
      description: charge.description,
      amount: charge.amount,
      currency: charge.currency,
      addedBy: charge.addedBy,
      isPaid: charge.isPaid,
      paidAt: charge.paidAt,
      createdAt: charge.createdAt,
    }));

    // Calculate totals
    const totalCharges = charges.reduce((sum, charge) => sum + charge.amount, 0);
    const unpaidCharges = charges
      .filter((charge) => !charge.isPaid)
      .reduce((sum, charge) => sum + charge.amount, 0);

    // Add user information and related data for admin response
    const adminReservationResponse: AdminReservationDetailsResponse = {
      ...reservationResponse,
      user: {
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
      modifications: modificationResponses,
      charges: chargeResponses,
      totalCharges,
      unpaidCharges,
    };

    logger.info(`Admin retrieved reservation details: ${reservationId}`);
    return adminReservationResponse;
  }
}

