import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IGetUserByIdUseCase } from '../../../application/use-cases/interface/user/get_user_by_id_use_case.interface';
import { IListUsersUseCase } from '../../../application/use-cases/interface/user/list_users_use_case.interface';
import { ListUsersRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * Admin user controller
 * Handles admin user management operations
 */
@injectable()
export class AdminUserController {
  constructor(
    @inject(USE_CASE_TOKENS.GetUserByIdUseCase)
    private readonly getUserByIdUseCase: IGetUserByIdUseCase,
    @inject(USE_CASE_TOKENS.ListUsersUseCase)
    private readonly listUsersUseCase: IListUsersUseCase,
  ) {}

  /**
   * Handles getting user by ID (admin view)
   */
  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get user by ID attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const userId = req.params.userId;
      if (!userId) {
        logger.warn('Get user by ID attempt without userId parameter');
        sendErrorResponse(res, new Error('User ID is required'));
        return;
      }

      logger.info(`Admin ${req.user.userId} viewing user: ${userId}`);
      const response = await this.getUserByIdUseCase.execute(userId);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error getting user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles listing users with pagination, filtering, and search
   */
  async listUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('List users attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract query parameters
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const status = req.query.status
        ? (Array.isArray(req.query.status)
            ? req.query.status
            : [req.query.status]
          ).map((s) => s as string)
        : undefined;
      const isVerifiedParam = req.query.isVerified;
      const isVerified =
        isVerifiedParam !== undefined
          ? isVerifiedParam === 'true' || isVerifiedParam === '1' || (typeof isVerifiedParam === 'string' && isVerifiedParam.toLowerCase() === 'true')
          : undefined;
      const search = req.query.search as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const request: ListUsersRequest = {
        page,
        limit,
        status,
        isVerified,
        search,
        sortBy,
        sortOrder,
      };

      logger.info(`Admin ${req.user.userId} listing users with filters: ${JSON.stringify(request)}`);
      const response = await this.listUsersUseCase.execute(request);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error listing users: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

