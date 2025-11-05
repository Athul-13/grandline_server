import { RegisterUserRequest, RegisterUserResponse } from '../../../dtos/user.dto';

export interface IRegisterUserUseCase {
  execute(request: RegisterUserRequest): Promise<RegisterUserResponse>;
} 