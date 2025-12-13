import { ResetDriverPasswordRequest, ResetDriverPasswordResponse } from '../../../dtos/driver.dto';

/**
 * Interface for the ResetDriverPassword use case
 * Defines the contract for handling driver password reset
 */
export interface IResetDriverPasswordUseCase {
  execute(request: ResetDriverPasswordRequest): Promise<ResetDriverPasswordResponse>;
}

