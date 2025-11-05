import { injectable } from 'tsyringe';
import nodemailer, { Transporter } from 'nodemailer';
import { IEmailService } from '../../domain/services/email_service.interface';
import { EmailType } from '../../shared/types/email.types';
import { EMAIL_CONFIG } from '../../shared/config';
import { getEmailTemplate } from '../../shared/templates/email';
import { logger } from '../../shared/logger';

/**
 * Email service implementation
 * Handles sending emails through nodemailer SMTP
 */
@injectable()
export class EmailServiceImpl implements IEmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: EMAIL_CONFIG.HOST,
      port: EMAIL_CONFIG.PORT,
      secure: EMAIL_CONFIG.SECURE,
      auth: {
        user: EMAIL_CONFIG.USER,
        pass: EMAIL_CONFIG.PASS,
      },
    });
  }

  async sendEmail<T extends { email: string }>(type: EmailType, data: T): Promise<void> {
    try {
      // Get template for the email type
      const template = getEmailTemplate(type);

      // Render HTML and text versions
      const html = template.html(data);
      const text = template.text(data);

      // Send email
      await this.transporter.sendMail({
        from: `"GRANDLINE" <${EMAIL_CONFIG.USER}>`,
        to: data.email,
        subject: this.getSubject(type),
        html,
        text,
      });
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw new Error('Failed to send email. Please try again later.');
    }
  }

  /**
   * Gets the subject line for the email based on type
   */
  private getSubject(type: EmailType): string {
    switch (type) {
      case EmailType.OTP:
        return 'Verify Your Email - GRANDLINE';
      case EmailType.PASSWORD_RESET:
        return 'Reset Your Password - GRANDLINE';
      default:
        return 'GRANDLINE';
    }
  }
}

