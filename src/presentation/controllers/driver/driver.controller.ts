import { Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { ILoginDriverUseCase } from '../../../application/use-cases/interface/driver/login_driver_use_case.interface';
import { IChangeDriverPasswordUseCase } from '../../../application/use-cases/interface/driver/change_driver_password_use_case.interface';
import { LoginDriverRequest, ChangeDriverPasswordRequest } from '../../../application/dtos/driver.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { AuthenticatedRequest } from '../../../shared/types/express.types';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';
import { logger } from '../../../shared/logger';

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
   * Handles changing driver password
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
}

