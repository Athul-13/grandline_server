import { EmailType } from '../../types/email.types';
import { OTPEmailData } from '../../types/email.types';
import { renderOTPHTML, renderOTPText } from './otp.template';

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

