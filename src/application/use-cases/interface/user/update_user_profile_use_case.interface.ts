import { UpdateUserProfileRequest, UpdateUserProfileResponse } from '../../../dtos/user.dto';

export interface IUpdateUserProfileUseCase {
  execute(userId: string, request: UpdateUserProfileRequest): Promise<UpdateUserProfileResponse>;
}

