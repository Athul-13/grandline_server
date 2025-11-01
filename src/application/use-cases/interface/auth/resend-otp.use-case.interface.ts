import { ResendOtpRequest, ResendOtpResponse } from '../../../dtos/user.dto';

export interface IResendOtpUseCase {
  execute(request: ResendOtpRequest): Promise<ResendOtpResponse>;
} 