import { ChangeDriverPasswordRequest, ChangeDriverPasswordResponse } from '../../../dtos/driver.dto';

export interface IChangeDriverPasswordUseCase {
  execute(driverId: string, request: ChangeDriverPasswordRequest): Promise<ChangeDriverPasswordResponse>;
}

