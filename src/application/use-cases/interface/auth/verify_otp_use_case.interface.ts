import { VerifyOtpRequest, VerifyOtpResponse } from '../../../dtos/user.dto';

export interface IVerifyOtpUseCase {
  execute(request: VerifyOtpRequest): Promise<VerifyOtpResponse>;
} 