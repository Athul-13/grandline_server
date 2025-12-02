import { UpdateDriverStatusRequest, UpdateDriverStatusResponse } from '../../../dtos/driver.dto';

export interface IUpdateDriverStatusUseCase {
  execute(driverId: string, request: UpdateDriverStatusRequest): Promise<UpdateDriverStatusResponse>;
}

