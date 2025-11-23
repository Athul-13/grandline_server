import { CreateQuoteDraftRequest, CreateQuoteDraftResponse } from '../../../dtos/quote.dto';

/**
 * Use case interface for creating a quote draft
 */
export interface ICreateQuoteDraftUseCase {
  execute(request: CreateQuoteDraftRequest, userId: string): Promise<CreateQuoteDraftResponse>;
}

