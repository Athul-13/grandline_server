import { UpdateProfilePictureRequest, UpdateProfilePictureResponse } from '../../../dtos/driver.dto';

export interface IUpdateProfilePictureUseCase {
  execute(driverId: string, request: UpdateProfilePictureRequest): Promise<UpdateProfilePictureResponse>;
}

