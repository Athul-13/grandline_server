import { ChangeUserStatusRequest, ChangeUserStatusResponse } from '../../../dtos/user.dto';

export interface IChangeUserStatusUseCase {
  execute(userId: string, request: ChangeUserStatusRequest): Promise<ChangeUserStatusResponse>;
}

