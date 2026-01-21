import { GetDriverEarningsRequest, GetDriverEarningsResponse } from '../../../dtos/driver.dto';

export interface IGetDriverEarningsUseCase {
  execute(request: GetDriverEarningsRequest): Promise<GetDriverEarningsResponse>;
}
