import { RefreshTokenRequest, RefreshTokenResponse } from '../../../dtos/user.dto';

export interface IRefreshTokenUseCase {
  execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}

