import { GoogleAuthRequest, GoogleAuthResponse } from '../../../dtos/user.dto';

export interface IGoogleAuthUseCase {
  execute(request: GoogleAuthRequest): Promise<GoogleAuthResponse>;
}

