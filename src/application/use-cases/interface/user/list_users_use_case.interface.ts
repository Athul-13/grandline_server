import { ListUsersRequest, ListUsersResponse } from '../../../dtos/user.dto';

export interface IListUsersUseCase {
  execute(request: ListUsersRequest): Promise<ListUsersResponse>;
}

