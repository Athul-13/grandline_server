import { injectable, inject } from 'tsyringe';
import { ICreateReservationUseCase } from '../../interface/reservation/create_reservation_use_case.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IPaymentRepository } from '../../../../domain/repositories/payment_repository.interface';
import { IUserRepository } from '../../../../domain/repositories/user_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IReservationItineraryRepository } from '../../../../domain/repositories/reservation_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../domain/repositories/passenger_repository.interface';
import { IPDFGenerationService } from '../../../../domain/services/pdf_generation_service.interface';
import { IEmailService } from '../../../../domain/services/email_service.interface';
import { ICreateNotificationUseCase } from '../../interface/notification/create_notification_use_case.interface';
import { REPOSITORY_TOKENS, SERVICE_TOKENS, USE_CASE_TOKENS } from '../../../di/tokens';
import { Reservation } from '../../../../domain/entities/reservation.entity';
import { ReservationItinerary } from '../../../../domain/entities/reservation_itinerary.entity';
import { ReservationStatus, TripType, ERROR_MESSAGES, NotificationType } from '../../../../shared/constants';
import { AppError } from '../../../../shared/utils/app_error.util';
import { logger } from '../../../../shared/logger';
import { randomUUID } from 'crypto';
import { EmailType, InvoiceEmailData } from '../../../../shared/types/email.types';
import { FRONTEND_CONFIG } from '../../../../shared/config';
import { ISocketEventService } from '../../../../domain/services/socket_event_service.interface';
import { container } from 'tsyringe';

/**
 * Use case for creating a reservation
 * Creates a reservation from quote data after payment completion
 */
@injectable()
export class CreateReservationUseCase implements ICreateReservationUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository,
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IPaymentRepository as never)
    private readonly paymentRepository: IPaymentRepository,
    @inject(REPOSITORY_TOKENS.IUserRepository)
    private readonly userRepository: IUserRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly quoteItineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IReservationItineraryRepository)
    private readonly reservationItineraryRepository: IReservationItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository,
    @inject(SERVICE_TOKENS.IPDFGenerationService)
    private readonly pdfGenerationService: IPDFGenerationService,
    @inject(SERVICE_TOKENS.IEmailService)
    private readonly emailService: IEmailService,
    @inject(USE_CASE_TOKENS.CreateNotificationUseCase)
    private readonly createNotificationUseCase: ICreateNotificationUseCase
  ) {}

  async execute(quoteId: string, paymentId: string): Promise<Reservation> {
    try {
      // Input validation
      if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
      }

      if (!paymentId || typeof paymentId !== 'string' || paymentId.trim().length === 0) {
        throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_PAYMENT_ID', 400);
      }

      logger.info(`Creating reservation for quote: ${quoteId}, payment: ${paymentId}`);

      // Get quote
      const quote = await this.quoteRepository.findById(quoteId);
      if (!quote) {
        throw new AppError('Quote not found', 'QUOTE_NOT_FOUND', 404);
      }

      // Get payment
      const payment = await this.paymentRepository.findById(paymentId);
      if (!payment) {
        throw new AppError('Payment not found', 'PAYMENT_NOT_FOUND', 404);
      }

      // Verify payment is for this quote
      if (payment.quoteId !== quoteId) {
        throw new AppError('Payment does not match quote', 'PAYMENT_QUOTE_MISMATCH', 400);
      }

      // Check if reservation already exists
      const existingReservation = await this.reservationRepository.findByQuoteId(quoteId);
      if (existingReservation) {
        logger.warn(`Reservation already exists for quote: ${quoteId}`);
        return existingReservation;
      }

      // Create reservation ID
      const reservationId = randomUUID();
      const now = new Date();

      // Create reservation entity from quote data
      const reservation = new Reservation(
        reservationId,
        quote.userId,
        quoteId,
        paymentId,
        quote.tripType,
        ReservationStatus.CONFIRMED,
        now, // reservationDate
        now, // createdAt
        now, // updatedAt
        quote.tripName,
        quote.eventType,
        quote.customEventType,
        quote.passengerCount,
        quote.selectedVehicles,
        quote.selectedAmenities,
        quote.routeData,
        quote.assignedDriverId,
        quote.assignedDriverId, // originalDriverId (same as assigned initially)
        {
          total: payment.amount,
          currency: payment.currency,
          paidAt: payment.paidAt || now,
        },
        now, // confirmedAt
        undefined, // driverChangedAt
        'none', // refundStatus
        undefined, // refundedAmount
        undefined, // refundedAt
        undefined, // cancellationReason
        undefined // cancelledAt
      );

      // Save reservation
      await this.reservationRepository.create(reservation);
      logger.info(`Reservation created: ${reservationId}`);

      // Copy itinerary from quote to reservation
      try {
        const quoteItinerary = await this.quoteItineraryRepository.findByQuoteId(quoteId);
        if (quoteItinerary && quoteItinerary.length > 0) {
          const reservationItinerary = quoteItinerary.map((stop) => {
            const itineraryId = randomUUID();
            return new ReservationItinerary(
              itineraryId,
              reservationId,
              stop.tripType,
              stop.stopOrder,
              stop.locationName,
              stop.latitude,
              stop.longitude,
              stop.arrivalTime,
              stop.stopType,
              new Date(),
              new Date(),
              stop.departureTime,
              stop.isDriverStaying,
              stop.stayingDuration
            );
          });

          // Save all itinerary stops
          for (const stop of reservationItinerary) {
            await this.reservationItineraryRepository.create(stop);
          }
          logger.info(`Copied ${reservationItinerary.length} itinerary stops to reservation: ${reservationId}`);
        }
      } catch (itineraryError) {
        logger.error(
          `Failed to copy itinerary for reservation ${reservationId}: ${itineraryError instanceof Error ? itineraryError.message : 'Unknown error'}`
        );
        // Don't fail reservation creation if itinerary copy fails
      }

      // Copy passengers from quote to reservation
      try {
        const passengers = await this.passengerRepository.findByQuoteId(quoteId);
        if (passengers && passengers.length > 0) {
          for (const passenger of passengers) {
            // Update passenger to link to reservation instead of quote
            await this.passengerRepository.updateById(passenger.passengerId, {
              reservationId,
              quoteId: undefined, // Remove quote link
            } as Partial<import('../../../../domain/entities/passenger.entity').Passenger>);
          }
          logger.info(`Linked ${passengers.length} passengers to reservation: ${reservationId}`);
        }
      } catch (passengerError) {
        logger.error(
          `Failed to link passengers for reservation ${reservationId}: ${passengerError instanceof Error ? passengerError.message : 'Unknown error'}`
        );
        // Don't fail reservation creation if passenger linking fails
      }

      // Get user for email
      const user = await this.userRepository.findById(quote.userId);
      if (user) {
        // Generate invoice PDF
        const pdfBuffer = await this.pdfGenerationService.generateInvoicePDF({
          reservation,
          user,
          invoiceNumber: reservationId, // Use reservationId as invoice number
          paymentAmount: payment.amount,
          paymentDate: payment.paidAt || now,
          paymentMethod: payment.paymentMethod,
        });

        // Prepare email data
        const viewReservationLink = `${FRONTEND_CONFIG.URL}/reservations/${reservationId}`;

        const emailData: InvoiceEmailData = {
          email: user.email,
          fullName: user.fullName,
          reservationId,
          invoiceNumber: reservationId,
          paymentAmount: payment.amount,
          paymentDate: payment.paidAt || now,
          paymentMethod: payment.paymentMethod,
          tripName: quote.tripName,
          tripType: quote.tripType === TripType.ONE_WAY ? 'one_way' : 'two_way',
          viewReservationLink,
        };

        // Send invoice email with PDF attachment
        try {
          await this.emailService.sendEmail(EmailType.INVOICE, emailData, [
            {
              filename: `invoice-${reservationId}.pdf`,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ]);
          logger.info(`Invoice email with PDF sent to ${user.email} for reservation: ${reservationId}`);
        } catch (emailError) {
          logger.error(
            `Failed to send invoice email for reservation ${reservationId}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`
          );
          // Don't fail reservation creation if email fails
        }
      }

      // Fetch and return created reservation
      const createdReservation = await this.reservationRepository.findById(reservationId);
      if (!createdReservation) {
        throw new AppError('Failed to create reservation', 'RESERVATION_CREATION_ERROR', 500);
      }

      // Send notification to user about reservation confirmation
      try {
        await this.createNotificationUseCase.execute({
          userId: quote.userId,
          type: NotificationType.RESERVATION_CONFIRMED,
          title: 'Reservation Confirmed',
          message: `Your reservation for "${quote.tripName || 'Trip'}" has been confirmed. Invoice has been sent to your email.`,
          data: {
            reservationId,
            quoteId,
            paymentId,
            tripName: quote.tripName,
            tripType: quote.tripType,
          },
        });
        logger.info(`Notification sent for reservation confirmation: ${reservationId}`);
      } catch (notificationError) {
        logger.error(
          `Failed to send notification for reservation confirmation: ${notificationError instanceof Error ? notificationError.message : 'Unknown error'}`
        );
        // Don't fail reservation creation if notification fails
      }

      // Emit socket event for admin dashboard
      try {
        const socketEventService = container.resolve<ISocketEventService>(SERVICE_TOKENS.ISocketEventService);
        socketEventService.emitReservationCreated(createdReservation);
      } catch (error) {
        // Don't fail reservation creation if socket emission fails
        logger.error('Error emitting reservation created event:', error);
      }

      logger.info(`Reservation created successfully: ${reservationId}`);
      return createdReservation;
    } catch (error) {
      logger.error(
        `Error creating reservation for quote ${quoteId}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to create reservation', 'RESERVATION_CREATION_ERROR', 500);
    }
  }
}

