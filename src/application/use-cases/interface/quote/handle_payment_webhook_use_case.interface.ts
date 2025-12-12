/**
 * Use case interface for handling payment webhooks
 */
export interface IHandlePaymentWebhookUseCase {
  execute(event: { type: string; data: { object: unknown } }): Promise<void>;
}
