import { CreateDriverRequest, CreateDriverResponse } from '../../../dtos/driver.dto';

export interface ICreateDriverUseCase {
  execute(request: CreateDriverRequest): Promise<CreateDriverResponse>;
}

