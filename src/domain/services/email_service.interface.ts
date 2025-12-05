import { EmailType } from '../../shared/types/email.types';

/**
 * Email attachment interface
 */
export interface IEmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/**
 * Email service interface
 * Handles sending emails through different providers
 */
export interface IEmailService {
  /**
   * Sends an email based on the specified type and data
   * @param type Email type
   * @param data Email data
   * @param attachments Optional attachments (e.g., PDF files)
   */
  sendEmail<T extends { email: string }>(
    type: EmailType,
    data: T,
    attachments?: IEmailAttachment[]
  ): Promise<void>;
}

