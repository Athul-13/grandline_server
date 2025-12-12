import { CompleteOnboardingRequest, CompleteOnboardingResponse } from '../../../dtos/driver.dto';

/**
 * Interface for completing driver onboarding use case
 */
export interface ICompleteDriverOnboardingUseCase {
  execute(driverId: string, request: CompleteOnboardingRequest): Promise<CompleteOnboardingResponse>;
}

