import { LoginUserRequest, LoginUserResponse } from '../../../dtos/user.dto';

export interface ILoginUserUseCase {
  execute(request: LoginUserRequest): Promise<LoginUserResponse>;
} 