import { GetUserStatisticsRequest, GetUserStatisticsResponse } from '../../../dtos/user.dto';

export interface IGetUserStatisticsUseCase {
  execute(request: GetUserStatisticsRequest): Promise<GetUserStatisticsResponse>;
}

