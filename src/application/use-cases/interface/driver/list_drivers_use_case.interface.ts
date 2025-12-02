import { ListDriversRequest, ListDriversResponse } from '../../../dtos/driver.dto';

export interface IListDriversUseCase {
  execute(request: ListDriversRequest): Promise<ListDriversResponse>;
}

