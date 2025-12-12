import { injectable, inject } from 'tsyringe';
import { ICreateChargePaymentIntentUseCase } from '../../interface/reservation/create_charge_payment_intent_use_case.interface';
import { CreatePaymentIntentResponse } from '../../../dtos/payment.dto';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IReservationChargeRepository } from '../../../../domain/repositories/reservation_charge_repository.interface';
import { IPaymentRepository } from '../../../../domain/repositories/payment_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { ERROR_MESSAGES } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { Payment } from '../../../../domain/entities/payment.entity';
import { PaymentStatus, PaymentMethod } from '../../../../domain/entities/payment.entity';
import { getStripeInstance } from '../../../../infrastructure/service/stripe.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for creating a payment intent for a reservation charge
 * Validates charge, creates Stripe Payment Intent, and saves payment record
 */
@injectable()
export class CreateChargePaymentIntentUseCase implements ICreateChargePaymentIntentUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IReservationChargeRepository)
    private readonly chargeRepository: IReservationChargeRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository)
    private readonly paymentRepository: IPaymentRepository
  ) {}

  async execute(reservationId: string, chargeId: string, userId: string): Promise<CreatePaymentIntentResponse> {
    try {
      // Input validation
      if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
      }

      if (!chargeId || typeof chargeId !== 'string' || chargeId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_CHARGE_ID', 400);
      }

      if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
      }

      logger.info(`Creating payment intent for charge: ${chargeId} on reservation: ${reservationId} by user: ${userId}`);

      // Get reservation and verify ownership
      const reservation = await this.reservationRepository.findById(reservationId);

      if (!reservation) {
        throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
      }

      if (reservation.userId !== userId) {
        throw new AppError('Reservation not found', 'RESERVATION_NOT_FOUND', 404);
      }

      // Get charge
      const charge = await this.chargeRepository.findById(chargeId);

      if (!charge) {
        throw new AppError('Charge not found', 'CHARGE_NOT_FOUND', 404);
      }

      // Verify charge belongs to reservation
      if (charge.reservationId !== reservationId) {
        throw new AppError('Charge does not belong to this reservation', 'INVALID_CHARGE', 400);
      }

      // Check if charge is already paid
      if (charge.isPaid) {
        throw new AppError('Charge has already been paid', 'CHARGE_ALREADY_PAID', 400);
      }

      // Check if payment already exists and is pending
      // For charge payments, we use reservationId as quoteId in the Payment entity
      const existingPayments = await this.paymentRepository.findByQuoteId(reservationId);
      const pendingPayment = existingPayments.find(
        (p) => 
          p.isPending() && 
          p.metadata && 
          typeof p.metadata === 'object' && 
          'chargeId' in p.metadata && 
          p.metadata.chargeId === chargeId
      );

      if (pendingPayment && pendingPayment.paymentIntentId) {
        // Return existing payment intent
        const stripe = getStripeInstance();
        const paymentIntent = await stripe.paymentIntents.retrieve(pendingPayment.paymentIntentId);

        logger.info(`Returning existing payment intent: ${pendingPayment.paymentIntentId}`);
        return {
          clientSecret: paymentIntent.client_secret as string,
          paymentIntentId: paymentIntent.id,
          paymentId: pendingPayment.paymentId,
        };
      }

      // Create Stripe Payment Intent
      const stripe = getStripeInstance();
      const amountInCents = Math.round(charge.amount * 100); // Convert to cents

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: charge.currency.toLowerCase(),
        metadata: {
          reservationId,
          chargeId,
          userId,
          paymentType: 'charge',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      logger.info(`Created Stripe payment intent: ${paymentIntent.id} for charge: ${chargeId}`);

      // Create Payment entity
      const paymentId = uuidv4();
      const payment = new Payment(
        paymentId,
        reservationId,
        userId,
        charge.amount,
        charge.currency,
        PaymentMethod.STRIPE,
        PaymentStatus.PENDING,
        new Date(),
        new Date(),
        paymentIntent.id,
        undefined,
        undefined,
        { stripePaymentIntentId: paymentIntent.id, chargeId, paymentType: 'charge' }
      );

      // Save payment to database
      await this.paymentRepository.create(payment);

      logger.info(`Created payment record: ${paymentId} for charge: ${chargeId}`);

      return {
        clientSecret: paymentIntent.client_secret as string,
        paymentIntentId: paymentIntent.id,
        paymentId,
      };
    } catch (error) {
      logger.error(
        `Error creating payment intent for charge: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
}

