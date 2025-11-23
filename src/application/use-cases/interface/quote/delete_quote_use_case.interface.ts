/**
 * Use case interface for deleting a quote
 */
export interface IDeleteQuoteUseCase {
  execute(quoteId: string, userId: string): Promise<void>;
}

