import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IGetUserByIdUseCase } from '../../../application/use-cases/interface/user/get_user_by_id_use_case.interface';
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
}

