import { EmailType } from '../../types/email.types';
import { OTPEmailData, PasswordResetEmailData, QuoteEmailData, InvoiceEmailData, RefundConfirmationEmailData, PaymentRequiredEmailData, CancellationWithRefundEmailData } from '../../types/email.types';
import { renderOTPHTML, renderOTPText } from './otp.template';
import { renderPasswordResetHTML, renderPasswordResetText } from './password_reset.template';
import { renderQuoteHTML, renderQuoteText } from './quote.template';
import { renderInvoiceHTML, renderInvoiceText } from './invoice.template';
import { renderRefundConfirmationHTML, renderRefundConfirmationText } from './refund_confirmation.template';
import { renderPaymentRequiredHTML, renderPaymentRequiredText } from './payment_required.template';
import { renderCancellationWithRefundHTML, renderCancellationWithRefundText } from './cancellation_with_refund.template';

/**
 * Template renderer type
 * Functions that take email data and return rendered content
 */
type TemplateRenderer = {
  html: (data: unknown) => string;
  text: (data: unknown) => string;
};

/**
 * Template registry
 * Maps email types to their corresponding template renderers
 */
const TEMPLATE_REGISTRY: Record<EmailType, TemplateRenderer> = {
  [EmailType.OTP]: {
    html: (data: unknown) => renderOTPHTML(data as OTPEmailData),
    text: (data: unknown) => renderOTPText(data as OTPEmailData),
  },
  [EmailType.PASSWORD_RESET]: {
    html: (data: unknown) => renderPasswordResetHTML(data as PasswordResetEmailData),
    text: (data: unknown) => renderPasswordResetText(data as PasswordResetEmailData),
  },
  [EmailType.QUOTE]: {
    html: (data: unknown) => renderQuoteHTML(data as QuoteEmailData),
    text: (data: unknown) => renderQuoteText(data as QuoteEmailData),
  },
  [EmailType.INVOICE]: {
    html: (data: unknown) => renderInvoiceHTML(data as InvoiceEmailData),
    text: (data: unknown) => renderInvoiceText(data as InvoiceEmailData),
  },
  [EmailType.REFUND_CONFIRMATION]: {
    html: (data: unknown) => renderRefundConfirmationHTML(data as RefundConfirmationEmailData),
    text: (data: unknown) => renderRefundConfirmationText(data as RefundConfirmationEmailData),
  },
  [EmailType.PAYMENT_REQUIRED]: {
    html: (data: unknown) => renderPaymentRequiredHTML(data as PaymentRequiredEmailData),
    text: (data: unknown) => renderPaymentRequiredText(data as PaymentRequiredEmailData),
  },
  [EmailType.CANCELLATION_WITH_REFUND]: {
    html: (data: unknown) => renderCancellationWithRefundHTML(data as CancellationWithRefundEmailData),
    text: (data: unknown) => renderCancellationWithRefundText(data as CancellationWithRefundEmailData),
  },
};

/**
 * Gets the template renderer for a specific email type
 */
export function getEmailTemplate(type: EmailType): TemplateRenderer {
  const template = TEMPLATE_REGISTRY[type];
  if (!template) {
    throw new Error(`No template found for email type: ${type}`);
  }
  return template;
}

