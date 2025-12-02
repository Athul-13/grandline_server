import { GetDriverStatisticsRequest, GetDriverStatisticsResponse } from '../../../dtos/driver.dto';

export interface IGetDriverStatisticsUseCase {
  execute(request: GetDriverStatisticsRequest): Promise<GetDriverStatisticsResponse>;
}

