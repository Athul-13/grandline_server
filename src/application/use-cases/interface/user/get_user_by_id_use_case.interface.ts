import { GetUserByIdResponse } from '../../../dtos/user.dto';

export interface IGetUserByIdUseCase {
  execute(userId: string): Promise<GetUserByIdResponse>;
}

