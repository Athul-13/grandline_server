import { UpdateOnboardingPasswordRequest, UpdateOnboardingPasswordResponse } from '../../../dtos/driver.dto';

export interface IUpdateOnboardingPasswordUseCase {
  execute(driverId: string, request: UpdateOnboardingPasswordRequest): Promise<UpdateOnboardingPasswordResponse>;
}

