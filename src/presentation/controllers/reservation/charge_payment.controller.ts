import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { HTTP_STATUS, ERROR_MESSAGES } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { AppError } from '../../../shared/utils/app_error.util';
import { ICreateChargePaymentIntentUseCase } from '../../../application/use-cases/interface/reservation/create_charge_payment_intent_use_case.interface';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';

/**
 * Charge Payment controller
 * Handles payment-related operations for reservation charges
 */
@injectable()
export class ChargePaymentController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateChargePaymentIntentUseCase)
    private readonly createChargePaymentIntentUseCase: ICreateChargePaymentIntentUseCase
  ) {}

  /**
   * Handles creating a payment intent for a reservation charge
   * POST /api/v1/reservations/:id/charges/:chargeId/payment/create-intent
   */
  async createPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id: reservationId, chargeId } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new AppError(ERROR_MESSAGES.UNAUTHORIZED, 'UNAUTHORIZED', 401);
      }

      if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
      }

      if (!chargeId || typeof chargeId !== 'string' || chargeId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CHARGE_ID', 400);
      }

      logger.info(`Creating payment intent for charge: ${chargeId} on reservation: ${reservationId} by user: ${userId}`);

      const result = await this.createChargePaymentIntentUseCase.execute(reservationId, chargeId, userId);

      logger.info(`Payment intent created successfully: ${result.paymentIntentId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, result);
    } catch (error) {
      logger.error(
        `Error creating payment intent for charge: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

