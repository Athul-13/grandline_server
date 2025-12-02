import { GetDriverByIdResponse } from '../../../dtos/driver.dto';

export interface IGetDriverByIdUseCase {
  execute(driverId: string): Promise<GetDriverByIdResponse>;
}

