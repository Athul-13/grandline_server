import { DeleteUserAccountRequest, DeleteUserAccountResponse } from '../../../dtos/user.dto';

export interface IDeleteUserAccountUseCase {
  execute(userId: string, request: DeleteUserAccountRequest): Promise<DeleteUserAccountResponse>;
}

