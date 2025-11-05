import { GetUserProfileResponse } from '../../../dtos/user.dto';

export interface IGetUserProfileUseCase {
  execute(userId: string): Promise<GetUserProfileResponse>;
}

