import { UpdateDriverRequest, UpdateDriverResponse } from '../../../dtos/driver.dto';

export interface IUpdateDriverUseCase {
  execute(driverId: string, request: UpdateDriverRequest): Promise<UpdateDriverResponse>;
}

