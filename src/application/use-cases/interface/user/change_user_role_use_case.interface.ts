import { ChangeUserRoleRequest, ChangeUserRoleResponse } from '../../../dtos/user.dto';

export interface IChangeUserRoleUseCase {
  execute(userId: string, request: ChangeUserRoleRequest): Promise<ChangeUserRoleResponse>;
}

