import { ForgotPasswordRequest, ForgotPasswordResponse } from '../../../dtos/user.dto';

export interface IForgotPasswordUseCase {
  execute(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse>;
}

