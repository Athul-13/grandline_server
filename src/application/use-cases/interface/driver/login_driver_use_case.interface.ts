import { LoginDriverRequest, LoginDriverResponse } from '../../../dtos/driver.dto';

export interface ILoginDriverUseCase {
  execute(request: LoginDriverRequest): Promise<LoginDriverResponse>;
}

