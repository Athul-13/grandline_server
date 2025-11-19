import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { ICreateQuoteDraftUseCase } from '../../../application/use-cases/interface/quote/create_quote_draft_use_case.interface';
import { IUpdateQuoteDraftUseCase } from '../../../application/use-cases/interface/quote/update_quote_draft_use_case.interface';
import { IGetQuoteUseCase } from '../../../application/use-cases/interface/quote/get_quote_use_case.interface';
import { IGetQuotesListUseCase } from '../../../application/use-cases/interface/quote/get_quotes_list_use_case.interface';
import { IDeleteQuoteUseCase } from '../../../application/use-cases/interface/quote/delete_quote_use_case.interface';
import { ICalculateRoutesUseCase } from '../../../application/use-cases/interface/quote/calculate_routes_use_case.interface';
import { IGetVehicleRecommendationsUseCase } from '../../../application/use-cases/interface/quote/get_vehicle_recommendations_use_case.interface';
import { ICalculateQuotePricingUseCase } from '../../../application/use-cases/interface/quote/calculate_quote_pricing_use_case.interface';
import { ISubmitQuoteUseCase } from '../../../application/use-cases/interface/quote/submit_quote_use_case.interface';
import {
  CreateQuoteDraftRequest,
  UpdateQuoteDraftRequest,
  CalculateRoutesRequest,
  RouteCalculationResponse,
  GetRecommendationsRequest,
  VehicleRecommendationResponse,
  PricingBreakdownResponse,
  SubmitQuoteRequest,
  SubmitQuoteResponse,
} from '../../../application/dtos/quote.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, QuoteStatus } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Quote controller
 * Handles quote operations
 */
@injectable()
export class QuoteController {
  constructor(
    @inject(USE_CASE_TOKENS.CreateQuoteDraftUseCase)
    private readonly createQuoteDraftUseCase: ICreateQuoteDraftUseCase,
    @inject(USE_CASE_TOKENS.UpdateQuoteDraftUseCase)
    private readonly updateQuoteDraftUseCase: IUpdateQuoteDraftUseCase,
    @inject(USE_CASE_TOKENS.GetQuoteUseCase)
    private readonly getQuoteUseCase: IGetQuoteUseCase,
    @inject(USE_CASE_TOKENS.GetQuotesListUseCase)
    private readonly getQuotesListUseCase: IGetQuotesListUseCase,
    @inject(USE_CASE_TOKENS.DeleteQuoteUseCase)
    private readonly deleteQuoteUseCase: IDeleteQuoteUseCase,
    @inject(USE_CASE_TOKENS.CalculateRoutesUseCase)
    private readonly calculateRoutesUseCase: ICalculateRoutesUseCase,
    @inject(USE_CASE_TOKENS.GetVehicleRecommendationsUseCase)
    private readonly getVehicleRecommendationsUseCase: IGetVehicleRecommendationsUseCase,
    @inject(USE_CASE_TOKENS.CalculateQuotePricingUseCase)
    private readonly calculateQuotePricingUseCase: ICalculateQuotePricingUseCase,
    @inject(USE_CASE_TOKENS.SubmitQuoteUseCase)
    private readonly submitQuoteUseCase: ISubmitQuoteUseCase
  ) {}

  /**
   * Handles creating a quote draft
   */
  async createQuoteDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request: CreateQuoteDraftRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Quote draft creation request by user: ${userId}`);

      const response = await this.createQuoteDraftUseCase.execute(request, userId);

      logger.info(`Quote draft created successfully: ${response.quoteId}`);
      sendSuccessResponse(res, HTTP_STATUS.CREATED, response);
    } catch (error) {
      logger.error(
        `Error creating quote draft: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating a quote draft
   */
  async updateQuoteDraft(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request: UpdateQuoteDraftRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Quote draft update request for ID: ${id} by user: ${userId}`);

      const response = await this.updateQuoteDraftUseCase.execute(id, request, userId);

      logger.info(`Quote draft updated successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error updating quote draft: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting a quote by ID
   */
  async getQuote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Quote fetch request for ID: ${id} by user: ${userId}`);

      const response = await this.getQuoteUseCase.execute(id, userId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting quotes list
   */
  async getQuotesList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const status = req.query.status
        ? (Array.isArray(req.query.status)
            ? req.query.status
            : [req.query.status]
          ).map((s) => s as QuoteStatus)
        : undefined;

      // Extract sorting parameters from query string
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      logger.info(`Quotes list request by user: ${userId}, page: ${page}, limit: ${limit}, sortBy: ${sortBy}, sortOrder: ${sortOrder}`);

      const response = await this.getQuotesListUseCase.execute(userId, page, limit, status, sortBy, sortOrder);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching quotes list: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles deleting a quote
   */
  async deleteQuote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Quote deletion request for ID: ${id} by user: ${userId}`);

      await this.deleteQuoteUseCase.execute(id, userId);

      logger.info(`Quote deleted successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.NO_CONTENT, { message: 'Quote deleted successfully' });
    } catch (error) {
      logger.error(`Error deleting quote: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles calculating routes for a quote
   */
  async calculateRoutes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request: CalculateRoutesRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Route calculation request for quote ID: ${id} by user: ${userId}`);

      const response = await this.calculateRoutesUseCase.execute(id, request, userId);

      logger.info(`Routes calculated successfully for quote: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error calculating routes: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting vehicle recommendations
   */
  async getVehicleRecommendations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request: GetRecommendationsRequest = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Vehicle recommendations request by user: ${userId}`);

      const response = await this.getVehicleRecommendationsUseCase.execute(request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error getting vehicle recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles calculating quote pricing
   */
  async calculateQuotePricing(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Pricing calculation request for quote ID: ${id} by user: ${userId}`);

      const response = await this.calculateQuotePricingUseCase.execute(id, userId);

      logger.info(`Pricing calculated successfully for quote: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error calculating pricing: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles submitting a quote
   */
  async submitQuote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;

      if (!userId) {
        throw new Error('User not authenticated');
      }

      logger.info(`Quote submission request for ID: ${id} by user: ${userId}`);

      const response = await this.submitQuoteUseCase.execute(id, userId);

      logger.info(`Quote submitted successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error submitting quote: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

