import { ForgotDriverPasswordRequest, ForgotDriverPasswordResponse } from '../../../dtos/driver.dto';

/**
 * Interface for the ForgotDriverPassword use case
 * Defines the contract for handling driver forgot password requests
 */
export interface IForgotDriverPasswordUseCase {
  execute(request: ForgotDriverPasswordRequest): Promise<ForgotDriverPasswordResponse>;
}

