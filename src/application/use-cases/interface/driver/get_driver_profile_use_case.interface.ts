import { GetDriverProfileResponse } from '../../../dtos/driver.dto';

export interface IGetDriverProfileUseCase {
  execute(driverId: string): Promise<GetDriverProfileResponse>;
}

