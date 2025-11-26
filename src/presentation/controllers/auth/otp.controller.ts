import { Request, Response } from 'express';
import { inject, injectable } from 'tsyringe';
import { IVerifyOtpUseCase } from '../../../application/use-cases/interface/auth/verify_otp_use_case.interface';
import { IResendOtpUseCase } from '../../../application/use-cases/interface/auth/resend_otp_use_case.interface';
import { VerifyOtpRequest, ResendOtpRequest } from '../../../application/dtos/user.dto';
import { USE_CASE_TOKENS } from '../../../application/di/tokens';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../../../shared/constants';
import { sendSuccessResponse, sendErrorResponse } from '../../../shared/utils/response.util';

/**
 * OTP controller
 * Handles OTP verification and resend operations
 */
@injectable()
export class OtpController {
  constructor(
    @inject(USE_CASE_TOKENS.VerifyOtpUseCase)
    private readonly verifyOtpUseCase: IVerifyOtpUseCase,
    @inject(USE_CASE_TOKENS.ResendOtpUseCase)
    private readonly resendOtpUseCase: IResendOtpUseCase
  ) {}

  /**
   * Handles OTP verification
   */
  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as VerifyOtpRequest;
      const response = await this.verifyOtpUseCase.execute(request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.OTP_VERIFIED);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }

  /**
   * Handles OTP resend
   */
  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as ResendOtpRequest;
      const response = await this.resendOtpUseCase.execute(request);

      sendSuccessResponse(res, HTTP_STATUS.OK, response, SUCCESS_MESSAGES.OTP_SENT);
    } catch (error) {
      sendErrorResponse(res, error);
    }
  }
}