import { ChangePasswordRequest, ChangePasswordResponse } from '../../../dtos/user.dto';

export interface IChangePasswordUseCase {
  execute(userId: string, request: ChangePasswordRequest): Promise<ChangePasswordResponse>;
}

