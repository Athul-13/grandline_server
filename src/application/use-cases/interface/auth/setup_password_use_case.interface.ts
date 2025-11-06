import { SetupPasswordRequest, SetupPasswordResponse } from '../../../dtos/user.dto';

export interface ISetupPasswordUseCase {
  execute(userId: string, request: SetupPasswordRequest): Promise<SetupPasswordResponse>;
}

