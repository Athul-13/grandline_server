import { ResetPasswordRequest, ResetPasswordResponse } from '../../../dtos/user.dto';

export interface IResetPasswordUseCase {
  execute(request: ResetPasswordRequest): Promise<ResetPasswordResponse>;
}

