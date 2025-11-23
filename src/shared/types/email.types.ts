/**
 * Email type enumeration
 * Defines all available email types in the system
 */
export enum EmailType {
  OTP = 'OTP',
  PASSWORD_RESET = 'PASSWORD_RESET',
  QUOTE = 'QUOTE',
}

/**
 * OTP email data interface
 * Contains all data needed to send an OTP verification email
 */
export interface OTPEmailData {
  email: string;
  otp: string;
  fullName?: string;
  expiryMinutes?: number;
}

/**
 * Password reset email data interface
 * Contains all data needed to send a password reset email
 */
export interface PasswordResetEmailData {
  email: string;
  resetLink: string;
  fullName?: string;
  expiryMinutes?: number;
}

/**
 * Quote email data interface
 * Contains all data needed to send a quote confirmation email
 */
export interface QuoteEmailData {
  email: string;
  fullName?: string;
  quoteId: string;
  tripName?: string;
  tripType: string;
  totalPrice: number;
  quoteDate: Date;
  viewQuoteLink?: string;
}

