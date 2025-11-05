import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IGetUserProfileUseCase } from '../../../application/use-cases/interface/user/get_user_profile_use_case.interface';
import { IUpdateUserProfileUseCase } from '../../../application/use-cases/interface/user/update_user_profile_use_case.interface';
import { UpdateUserProfileRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../infrastructure/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

/**
 * User controller
 * Handles user profile operations
 */
@injectable()
export class UserController {
  constructor(
    @inject(USE_CASE_TOKENS.GetUserProfileUseCase)
    private readonly getUserProfileUseCase: IGetUserProfileUseCase,
    @inject(USE_CASE_TOKENS.UpdateUserProfileUseCase)
    private readonly updateUserProfileUseCase: IUpdateUserProfileUseCase
  ) {}

  /**
   * Handles getting user profile
   */
  async getUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Profile fetch attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Profile fetch request for user: ${req.user.userId}`);
      const response = await this.getUserProfileUseCase.execute(req.user.userId);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating user profile
   */
  async updateUserProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Profile update attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request: UpdateUserProfileRequest = req.body;
      const updateFields = Object.keys(request).filter(key => request[key as keyof UpdateUserProfileRequest] !== undefined);
      logger.info(`Profile update request for user: ${req.user.userId}, fields: ${updateFields.join(', ')}`);

      const response = await this.updateUserProfileUseCase.execute(req.user.userId, request);

      logger.info(`Profile updated successfully for user: ${req.user.userId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      logger.error(`Error updating user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

