import { injectable, inject } from 'tsyringe';
import { IUpdateQuoteDraftUseCase } from '../../interface/quote/update_quote_draft_use_case.interface';
import { IQuoteRepository } from '../../../../domain/repositories/quote_repository.interface';
import { IQuoteItineraryRepository } from '../../../../domain/repositories/quote_itinerary_repository.interface';
import { IPassengerRepository } from '../../../../domain/repositories/passenger_repository.interface';
import { UpdateQuoteDraftRequest, QuoteResponse } from '../../../dtos/quote.dto';
import { REPOSITORY_TOKENS } from '../../../../infrastructure/di/tokens';
import { QuoteMapper } from '../../../mapper/quote.mapper';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { logger } from '../../../../shared/logger';
import { Quote } from '../../../../domain/entities/quote.entity';
import { QuoteItinerary } from '../../../../domain/entities/quote_itinerary.entity';
import { Passenger } from '../../../../domain/entities/passenger.entity';
import { AppError } from '../../../../shared/utils/app_error.util';
import { v4 as uuidv4 } from 'uuid';

/**
 * Use case for updating a quote draft
 * Updates quote draft with new data (auto-save functionality)
 */
@injectable()
export class UpdateQuoteDraftUseCase implements IUpdateQuoteDraftUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IQuoteRepository)
    private readonly quoteRepository: IQuoteRepository,
    @inject(REPOSITORY_TOKENS.IQuoteItineraryRepository)
    private readonly itineraryRepository: IQuoteItineraryRepository,
    @inject(REPOSITORY_TOKENS.IPassengerRepository)
    private readonly passengerRepository: IPassengerRepository
  ) {}

  async execute(
    quoteId: string,
    request: UpdateQuoteDraftRequest,
    userId: string
  ): Promise<QuoteResponse> {
    // Input validation
    if (!quoteId || typeof quoteId !== 'string' || quoteId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_QUOTE_ID', 400);
    }

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_USER_ID', 400);
    }

    if (!request) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_REQUEST', 400);
    }

    // Get existing quote
    const existingQuote = await this.quoteRepository.findById(quoteId);

    if (!existingQuote) {
      logger.warn(`Attempt to update non-existent quote: ${quoteId}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Verify ownership
    if (existingQuote.userId !== userId) {
      logger.warn(`User ${userId} attempted to update quote ${quoteId} owned by ${existingQuote.userId}`);
      throw new AppError(ERROR_MESSAGES.FORBIDDEN, ERROR_CODES.FORBIDDEN, 403);
    }

    // Check if quote can be edited
    if (!existingQuote.canBeEdited()) {
      logger.warn(`Attempt to update quote ${quoteId} with status ${existingQuote.status}`);
      throw new AppError(ERROR_MESSAGES.QUOTE_ALREADY_SUBMITTED, ERROR_CODES.QUOTE_ALREADY_SUBMITTED, 400);
    }

    // Build update object (plain object for MongoDB update)
    const update: Record<string, unknown> = {};

    if (request.tripType !== undefined) {
      update.tripType = request.tripType;
    }

    if (request.currentStep !== undefined) {
      update.currentStep = request.currentStep;
    }

    if (request.tripName !== undefined) {
      update.tripName = request.tripName;
    }

    if (request.eventType !== undefined) {
      update.eventType = request.eventType;
    }

    if (request.customEventType !== undefined) {
      update.customEventType = request.customEventType;
    }

    if (request.passengers !== undefined) {
      update.passengerCount = request.passengers.length;
    }

    if (request.selectedVehicles !== undefined) {
      update.selectedVehicles = request.selectedVehicles;
    }

    if (request.selectedAmenities !== undefined) {
      update.selectedAmenities = request.selectedAmenities;
    }

    // Update quote (cast to Partial<Quote> for type compatibility)
    await this.quoteRepository.updateById(quoteId, update as Partial<Quote>);

    // Save itinerary if provided
    if (request.itinerary) {
      // Delete existing itinerary for this quote
      await this.itineraryRepository.deleteByQuoteId(quoteId);

      // Save outbound itinerary
      if (request.itinerary.outbound && request.itinerary.outbound.length > 0) {
        const now = new Date();
        const outboundItinerary: QuoteItinerary[] = request.itinerary.outbound
          .filter((stop) => stop.arrivalTime) // Only save stops with arrivalTime
          .map((stop, index) => {
            return new QuoteItinerary(
              uuidv4(),
              quoteId,
              'outbound',
              index + 1,
              stop.locationName,
              stop.latitude,
              stop.longitude,
              new Date(stop.arrivalTime!),
              stop.stopType,
              now,
              now,
              stop.departureTime ? new Date(stop.departureTime) : undefined,
              stop.isDriverStaying || false,
              stop.stayingDuration
            );
          });

        // Save each itinerary stop
        for (const itineraryStop of outboundItinerary) {
          await this.itineraryRepository.create(itineraryStop);
        }
      }

      // Save return itinerary if present
      if (request.itinerary.return && request.itinerary.return.length > 0) {
        const now = new Date();
        const returnItinerary: QuoteItinerary[] = request.itinerary.return
          .filter((stop) => stop.arrivalTime) // Only save stops with arrivalTime
          .map((stop, index) => {
            return new QuoteItinerary(
              uuidv4(),
              quoteId,
              'return',
              index + 1,
              stop.locationName,
              stop.latitude,
              stop.longitude,
              new Date(stop.arrivalTime!),
              stop.stopType,
              now,
              now,
              stop.departureTime ? new Date(stop.departureTime) : undefined,
              stop.isDriverStaying || false,
              stop.stayingDuration
            );
          });

        // Save each itinerary stop
        for (const itineraryStop of returnItinerary) {
          await this.itineraryRepository.create(itineraryStop);
        }
      }

      logger.info(`Itinerary saved for quote: ${quoteId}`);
    }

    // Save passengers if provided
    if (request.passengers !== undefined) {
      // Delete existing passengers for this quote
      await this.passengerRepository.deleteByQuoteId(quoteId);

      // Save new passengers
      if (request.passengers.length > 0) {
        const now = new Date();
        const passengers: Passenger[] = request.passengers.map((passengerDto) => {
          return new Passenger(
            uuidv4(),
            passengerDto.fullName,
            passengerDto.phoneNumber,
            passengerDto.age,
            now,
            now,
            quoteId,
            undefined // reservationId is undefined for quotes
          );
        });

        // Save each passenger
        for (const passenger of passengers) {
          await this.passengerRepository.create(passenger);
        }
      }

      logger.info(`Passengers saved for quote: ${quoteId}`);
    }

    // Fetch updated quote
    const updatedQuote = await this.quoteRepository.findById(quoteId);
    if (!updatedQuote) {
      throw new AppError(ERROR_MESSAGES.QUOTE_NOT_FOUND, ERROR_CODES.QUOTE_NOT_FOUND, 404);
    }

    // Fetch itinerary and passengers to include in response
    const itineraryStops = await this.itineraryRepository.findByQuoteIdOrdered(quoteId);
    const passengers = await this.passengerRepository.findByQuoteId(quoteId);

    return QuoteMapper.toQuoteResponse(updatedQuote, itineraryStops, passengers);
  }
}

