import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IGetUserProfileUseCase } from '../../../application/use-cases/interface/user/get_user_profile_use_case.interface';
import { IUpdateUserProfileUseCase } from '../../../application/use-cases/interface/user/update_user_profile_use_case.interface';
import { IGenerateUploadUrlUseCase } from '../../../application/use-cases/interface/user/generate_upload_url_use_case.interface';
import { IChangePasswordUseCase } from '../../../application/use-cases/interface/user/change_password_use_case.interface';
import { UpdateUserProfileRequest, ChangePasswordRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
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
    private readonly updateUserProfileUseCase: IUpdateUserProfileUseCase,
    @inject(USE_CASE_TOKENS.GenerateUploadUrlUseCase)
    private readonly generateUploadUrlUseCase: IGenerateUploadUrlUseCase,
    @inject(USE_CASE_TOKENS.ChangePasswordUseCase)
    private readonly changePasswordUseCase: IChangePasswordUseCase
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

      const request = req.body as UpdateUserProfileRequest;
      const updateFields = Object.keys(request).filter(key => {
        const value = request[key as keyof UpdateUserProfileRequest];
        return value !== undefined;
      });
      logger.info(`Profile update request for user: ${req.user.userId}, fields: ${updateFields.join(', ')}`);

      const response = await this.updateUserProfileUseCase.execute(req.user.userId, request);

      logger.info(`Profile updated successfully for user: ${req.user.userId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      logger.error(`Error updating user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles generating signed upload URL for profile picture
   */
  async generateUploadUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Upload URL generation attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Upload URL generation request for user: ${req.user.userId}`);
      const response = await this.generateUploadUrlUseCase.execute(req.user.userId);

      logger.info(`Upload URL generated successfully for user: ${req.user.userId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error generating upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles changing user password
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Password change attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as ChangePasswordRequest;
      logger.info(`Password change request for user: ${req.user.userId}`);

      const response = await this.changePasswordUseCase.execute(req.user.userId, request);

      logger.info(`Password changed successfully for user: ${req.user.userId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.PASSWORD_CHANGED_SUCCESS);
    } catch (error) {
      logger.error(`Error changing password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }
}

