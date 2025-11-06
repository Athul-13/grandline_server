import { LinkGoogleRequest, LinkGoogleResponse } from '../../../dtos/user.dto';

export interface ILinkGoogleAccountUseCase {
  execute(userId: string, request: LinkGoogleRequest): Promise<LinkGoogleResponse>;
}

