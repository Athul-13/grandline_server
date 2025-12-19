import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ILoginDriverUseCase } from '../../../application/use-cases/interface/driver/login_driver_use_case.interface';
import { IChangeDriverPasswordUseCase } from '../../../application/use-cases/interface/driver/change_driver_password_use_case.interface';
import { IForgotDriverPasswordUseCase } from '../../../application/use-cases/interface/driver/forgot_driver_password_use_case.interface';
import { IResetDriverPasswordUseCase } from '../../../application/use-cases/interface/driver/reset_driver_password_use_case.interface';
import { IUpdateProfilePictureUseCase } from '../../../application/use-cases/interface/driver/update_profile_picture_use_case.interface';
import { IUpdateLicenseCardPhotoUseCase } from '../../../application/use-cases/interface/driver/update_license_card_photo_use_case.interface';
import { IUpdateOnboardingPasswordUseCase } from '../../../application/use-cases/interface/driver/update_onboarding_password_use_case.interface';
import { IGetDriverProfileUseCase } from '../../../application/use-cases/interface/driver/get_driver_profile_use_case.interface';
import { ICompleteDriverOnboardingUseCase } from '../../../application/use-cases/interface/driver/complete_driver_onboarding_use_case.interface';
import { IGetDriverInfoUseCase } from '../../../application/use-cases/interface/driver/get_driver_info_use_case.interface';
import { IGenerateDriverUploadUrlUseCase } from '../../../application/use-cases/interface/driver/generate_driver_upload_url_use_case.interface';
import { ISaveDriverFcmTokenUseCase } from '../../../application/use-cases/interface/driver/save_driver_fcm_token_use_case.interface';
import { IGetDriverDashboardUseCase } from '../../../application/use-cases/interface/driver/get_driver_dashboard_use_case.interface';
import { IGetDriverReservationUseCase } from '../../../application/use-cases/interface/driver/get_driver_reservation_use_case.interface';
import { LoginDriverRequest, ChangeDriverPasswordRequest, ForgotDriverPasswordRequest, ResetDriverPasswordRequest, UpdateProfilePictureRequest, UpdateLicenseCardPhotoRequest, UpdateOnboardingPasswordRequest, CompleteOnboardingRequest, SaveFcmTokenRequest } from '../../../application/dtos/driver.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';
import { DriverDashboardRequestDto } from '../../../application/dtos/driver_dashboard.dto';

/**
 * Driver controller (mobile app)
 * Handles driver authentication and profile operations
 */
@injectable()
export class DriverController {
  constructor(
    @inject(USE_CASE_TOKENS.LoginDriverUseCase)
    private readonly loginDriverUseCase: ILoginDriverUseCase,
    @inject(USE_CASE_TOKENS.ChangeDriverPasswordUseCase)
    private readonly changeDriverPasswordUseCase: IChangeDriverPasswordUseCase,
    @inject(USE_CASE_TOKENS.ForgotDriverPasswordUseCase)
    private readonly forgotDriverPasswordUseCase: IForgotDriverPasswordUseCase,
    @inject(USE_CASE_TOKENS.ResetDriverPasswordUseCase)
    private readonly resetDriverPasswordUseCase: IResetDriverPasswordUseCase,
    @inject(USE_CASE_TOKENS.UpdateProfilePictureUseCase)
    private readonly updateProfilePictureUseCase: IUpdateProfilePictureUseCase,
    @inject(USE_CASE_TOKENS.UpdateLicenseCardPhotoUseCase)
    private readonly updateLicenseCardPhotoUseCase: IUpdateLicenseCardPhotoUseCase,
    @inject(USE_CASE_TOKENS.UpdateOnboardingPasswordUseCase)
    private readonly updateOnboardingPasswordUseCase: IUpdateOnboardingPasswordUseCase,
    @inject(USE_CASE_TOKENS.GetDriverProfileUseCase)
    private readonly getDriverProfileUseCase: IGetDriverProfileUseCase,
    @inject(USE_CASE_TOKENS.CompleteDriverOnboardingUseCase)
    private readonly completeDriverOnboardingUseCase: ICompleteDriverOnboardingUseCase,
    @inject(USE_CASE_TOKENS.GetDriverInfoUseCase)
    private readonly getDriverInfoUseCase: IGetDriverInfoUseCase,
    @inject(USE_CASE_TOKENS.GenerateDriverUploadUrlUseCase)
    private readonly generateDriverUploadUrlUseCase: IGenerateDriverUploadUrlUseCase,
    @inject(USE_CASE_TOKENS.SaveDriverFcmTokenUseCase)
    private readonly saveDriverFcmTokenUseCase: ISaveDriverFcmTokenUseCase,
    @inject(USE_CASE_TOKENS.GetDriverDashboardUseCase)
    private readonly getDriverDashboardUseCase: IGetDriverDashboardUseCase,
    @inject(USE_CASE_TOKENS.GetDriverReservationUseCase)
    private readonly getDriverReservationUseCase: IGetDriverReservationUseCase,
  ) {}

  /**
   * Handles driver login
   */
  async loginDriver(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request = req.body as LoginDriverRequest;
      logger.info(`Driver login attempt: ${request.email}`);

      const response = await this.loginDriverUseCase.execute(request);

      logger.info(`Driver logged in successfully: ${response.driver.email}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_LOGIN_SUCCESS);
    } catch (error) {
      logger.error(`Error logging in driver: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles changing driver password (authenticated)
   */
  async changeDriverPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Change password attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      // For drivers, userId field contains the driverId
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Change password attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as ChangeDriverPasswordRequest;
      logger.info(`Password change request for driver: ${driverId}`);

      const response = await this.changeDriverPasswordUseCase.execute(driverId, request);

      logger.info(`Password changed successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_PASSWORD_CHANGED);
    } catch (error) {
      logger.error(`Error changing driver password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles driver forgot password request (public)
   */
  async forgotDriverPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request = req.body as ForgotDriverPasswordRequest;
      logger.info(`Driver forgot password request: ${request.email}`);

      const response = await this.forgotDriverPasswordUseCase.execute(request);

      logger.info(`Password reset email sent to driver: ${request.email}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error processing driver forgot password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles driver password reset (public)
   */
  async resetDriverPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const request = req.body as ResetDriverPasswordRequest;
      logger.info('Driver password reset request');

      const response = await this.resetDriverPasswordUseCase.execute(request);

      logger.info('Driver password reset successfully');
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error resetting driver password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating driver profile picture (onboarding)
   */
  async updateProfilePicture(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Update profile picture attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Update profile picture attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as UpdateProfilePictureRequest;
      logger.info(`Profile picture update request for driver: ${driverId}`);

      const response = await this.updateProfilePictureUseCase.execute(driverId, request);

      logger.info(`Profile picture updated successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_PROFILE_PICTURE_UPDATED);
    } catch (error) {
      logger.error(`Error updating profile picture: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating driver license card photo (onboarding)
   */
  async updateLicenseCardPhoto(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Update license card photo attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Update license card photo attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as UpdateLicenseCardPhotoRequest;
      logger.info(`License card photo update request for driver: ${driverId}`);

      const response = await this.updateLicenseCardPhotoUseCase.execute(driverId, request);

      logger.info(`License card photo updated successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_LICENSE_CARD_UPDATED);
    } catch (error) {
      logger.error(`Error updating license card photo: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles updating driver password during onboarding (optional)
   */
  async updateOnboardingPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Update onboarding password attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Update onboarding password attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as UpdateOnboardingPasswordRequest;
      logger.info(`Onboarding password update request for driver: ${driverId}`);

      const response = await this.updateOnboardingPasswordUseCase.execute(driverId, request);

      logger.info(`Onboarding password updated successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.DRIVER_ONBOARDING_PASSWORD_UPDATED);
    } catch (error) {
      logger.error(`Error updating onboarding password: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting driver profile
   */
  async getDriverProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get profile attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Get profile attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Profile fetch request for driver: ${driverId}`);
      const response = await this.getDriverProfileUseCase.execute(driverId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching driver profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles completing driver onboarding
   */
  async completeOnboarding(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Complete onboarding attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Complete onboarding attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as CompleteOnboardingRequest;
      logger.info(`Complete onboarding request for driver: ${driverId}`);

      const response = await this.completeDriverOnboardingUseCase.execute(driverId, request);

      logger.info(`Onboarding completed successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error completing onboarding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles getting driver info
   */
  async getDriverInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get driver info attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Get driver info attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Driver info fetch request for driver: ${driverId}`);
      const response = await this.getDriverInfoUseCase.execute(driverId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error fetching driver info: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles generating signed upload URL for driver profile picture/license card
   */
  async generateUploadUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Upload URL generation attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Upload URL generation attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      logger.info(`Upload URL generation request for driver: ${driverId}`);
      const response = await this.generateDriverUploadUrlUseCase.execute(driverId);

      logger.info(`Upload URL generated successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(`Error generating upload URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles saving driver FCM token for push notifications
   */
  async saveFcmToken(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Save FCM token attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      // Extract driverId from JWT payload
      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Save FCM token attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request = req.body as SaveFcmTokenRequest;
      logger.info(`FCM token save request for driver: ${driverId}`);

      const response = await this.saveDriverFcmTokenUseCase.execute({
        driverId,
        fcmToken: request.fcmToken,
        deviceId: request.deviceId,
        platform: request.platform,
      });

      logger.info(`FCM token saved successfully for driver: ${driverId}`);
      sendSuccessResponse(res, HTTP_STATUS.OK, response, 'FCM token saved successfully');
    } catch (error) {
      logger.error(`Error saving FCM token: ${error instanceof Error ? error.message : 'Unknown error'}`);
      sendErrorResponse(res, error);
    }
  }

  /**
   * Driver Dashboard (Trips)
   * GET /api/v1/driver/dashboard
   */
  async getDashboard(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Driver dashboard attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Driver dashboard attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const request: DriverDashboardRequestDto = {
        pastCursor: typeof req.query.pastCursor === 'string' ? req.query.pastCursor : undefined,
        pastLimit: typeof req.query.pastLimit === 'string' ? Number(req.query.pastLimit) : undefined,
      };

      const response = await this.getDriverDashboardUseCase.execute(driverId, request);
      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching driver dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }

  /**
   * Get Driver Reservation Details
   * GET /api/v1/driver/reservations/:id
   */
  async getReservation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        logger.warn('Get driver reservation attempt without authentication');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const driverId = req.user.userId;
      if (!driverId) {
        logger.warn('Get driver reservation attempt without userId in token');
        sendErrorResponse(res, new Error('Unauthorized'));
        return;
      }

      const { id: reservationId } = req.params;

      logger.info(`Driver reservation details request: driver=${driverId}, reservation=${reservationId}`);

      const response = await this.getDriverReservationUseCase.execute(driverId, reservationId);

      sendSuccessResponse(res, HTTP_STATUS.OK, response);
    } catch (error) {
      logger.error(
        `Error fetching driver reservation details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      sendErrorResponse(res, error);
    }
  }
}

