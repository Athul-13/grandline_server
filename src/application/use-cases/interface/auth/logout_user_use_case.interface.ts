import { LogoutUserRequest, LogoutUserResponse } from '../../../dtos/user.dto';

export interface ILogoutUserUseCase {
  execute(request: LogoutUserRequest): Promise<LogoutUserResponse>;
}

