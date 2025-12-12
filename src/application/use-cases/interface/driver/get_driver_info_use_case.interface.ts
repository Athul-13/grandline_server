import { GetDriverInfoResponse } from '../../../dtos/driver.dto';

/**
 * Interface for getting driver info use case
 */
export interface IGetDriverInfoUseCase {
  execute(driverId: string): Promise<GetDriverInfoResponse>;
}

