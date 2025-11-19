import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { IGetAdminQuotesListUseCase } from '../../../application/use-cases/interface/admin/get_admin_quotes_list_use_case.interface';
import { IGetAdminQuoteUseCase } from '../../../application/use-cases/interface/admin/get_admin_quote_use_case.interface';
import { IUpdateQuoteStatusUseCase } from '../../../application/use-cases/interface/admin/update_quote_status_use_case.interface';
import { UpdateQuoteStatusRequest } from '../../../application/dtos/quote.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, QuoteStatus } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Admin quote controller
 * Handles admin quote management operations
 */
@injectable()
export class AdminQuoteController {
  constructor(
    @inject(USE_CASE_TOKENS.GetAdminQuotesListUseCase)
    private readonly getAdminQuotesListUseCase: IGetAdminQuotesListUseCase,
    @inject(USE_CASE_TOKENS.GetAdminQuoteUseCase)
    private readonly getAdminQuoteUseCase: IGetAdminQuoteUseCase,
    @inject(USE_CASE_TOKENS.UpdateQuoteStatusUseCase)
    private readonly updateQuoteStatusUseCase: IUpdateQuoteStatusUseCase
  ) {}

  /**
   * Handles getting admin quotes list
   */
  async getQuotesList(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const status = req.query.status
        ? (Array.isArray(req.query.status)
            ? req.query.status
            : [req.query.status]
          ).map((s) => s as QuoteStatus)
        : undefined;
      const includeDeletedParam = req.query.includeDeleted;
      const includeDeleted =
        includeDeletedParam === 'true' ||
        includeDeletedParam === '1' ||
        (typeof includeDeletedParam === 'string' && includeDeletedParam.toLowerCase() === 'true');
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      logger.info(
        `Admin quotes list request: page=${page}, limit=${limit}, status=${status?.join(',') || 'all'}, includeDeleted=${includeDeleted}, search=${search || 'none'}`
      );

      const response = await this.getAdminQuotesListUseCase.execute(
        page,
        limit,
        status,
        includeDeleted,
        search,
        sortBy,
        sortOrder
      );

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching admin quotes list: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting admin quote details
   */
  async getQuote(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      logger.info(`Admin quote details request for ID: ${id}`);

      const response = await this.getAdminQuoteUseCase.execute(id);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching admin quote details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating quote status
   */
  async updateQuoteStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = req.body as UpdateQuoteStatusRequest;

      logger.info(`Admin quote status update request for ID: ${id}, new status: ${request.status}`);

      const response = await this.updateQuoteStatusUseCase.execute(id, request);

      logger.info(`Quote status updated successfully: ${id}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error updating quote status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

