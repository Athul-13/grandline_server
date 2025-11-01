import { EmailType } from '../../shared/types/email.types';

/**
 * Email service interface
 * Handles sending emails through different providers
 */
export interface IEmailService {
  /**
   * Sends an email based on the specified type and data
   */
  sendEmail<T extends { email: string }>(type: EmailType, data: T): Promise<void>;
}

