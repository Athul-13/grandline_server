import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IGetUserByIdUseCase } from '../../../application/use-cases/interface/user/get_user_by_id_use_case.interface';
import { IListUsersUseCase } from '../../../application/use-cases/interface/user/list_users_use_case.interface';
import { IChangeUserStatusUseCase } from '../../../application/use-cases/interface/user/change_user_status_use_case.interface';
import { IChangeUserRoleUseCase } from '../../../application/use-cases/interface/user/change_user_role_use_case.interface';
import { IGetUserStatisticsUseCase } from '../../../application/use-cases/interface/user/get_user_statistics_use_case.interface';
import { ListUsersRequest, ChangeUserStatusRequest, ChangeUserRoleRequest, GetUserStatisticsRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
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
    @inject(USE_CASE_TOKENS.ChangeUserStatusUseCase)
    private readonly changeUserStatusUseCase: IChangeUserStatusUseCase,
    @inject(USE_CASE_TOKENS.ChangeUserRoleUseCase)
    private readonly changeUserRoleUseCase: IChangeUserRoleUseCase,
    @inject(USE_CASE_TOKENS.GetUserStatisticsUseCase)
    private readonly getUserStatisticsUseCase: IGetUserStatisticsUseCase,
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

  /**
   * Handles changing user status
   */
  async changeUserStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Change user status attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const userId = req.params.userId;
      if (!userId) {
        logger.warn('Change user status attempt without userId parameter');
        sendErrorResponse(res, new Error('User ID is required'));
        return;
      }

      const request = req.body as ChangeUserStatusRequest;
      logger.info(`Admin ${req.user.userId} changing status for user: ${userId} to ${request.status}`);
      
      const response = await this.changeUserStatusUseCase.execute(userId, request);
      
      logger.info(`User status changed successfully: ${userId} to ${request.status}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.USER_STATUS_UPDATED);
    } catch (error) {
      logger.error(`Error changing user status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles changing user role
   */
  async changeUserRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Change user role attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const userId = req.params.userId;
      if (!userId) {
        logger.warn('Change user role attempt without userId parameter');
        sendErrorResponse(res, new Error('User ID is required'));
        return;
      }

      const request = req.body as ChangeUserRoleRequest;
      logger.info(`Admin ${req.user.userId} changing role for user: ${userId} to ${request.role}`);
      
      const response = await this.changeUserRoleUseCase.execute(userId, request);
      
      logger.info(`User role changed successfully: ${userId} to ${request.role}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.USER_ROLE_UPDATED);
    } catch (error) {
      logger.error(`Error changing user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting user statistics
   */
  async getUserStatistics(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get user statistics attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.query as unknown as GetUserStatisticsRequest;
      logger.info(`Admin ${req.user.userId} requesting user statistics: ${request.timeRange || 'all_time'}`);
      
      const response = await this.getUserStatisticsUseCase.execute(request);
      
      logger.info('User statistics retrieved successfully');
      sendSuccessResponse(res, HTTP_STATUS.OK, response, 'User statistics retrieved successfully');
    } catch (error) {
      logger.error(`Error getting user statistics: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

