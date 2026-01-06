/**
 * Email type enumeration
 * Defines all available email types in the system
 */
export enum EmailType {
  OTP = 'OTP',
  PASSWORD_RESET = 'PASSWORD_RESET',
  QUOTE = 'QUOTE',
  INVOICE = 'INVOICE',
  REFUND_CONFIRMATION = 'REFUND_CONFIRMATION',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
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
  quoteNumber: string;
  tripName?: string;
  tripType: string;
  totalPrice: number;
  quoteDate: Date;
  viewQuoteLink?: string;
  paymentLink?: string;
}

/**
 * Invoice email data interface
 * Contains all data needed to send an invoice email
 */
export interface InvoiceEmailData {
  email: string;
  fullName?: string;
  reservationNumber: string;
  invoiceNumber: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
  tripName?: string;
  tripType: string;
  viewReservationLink?: string;
}

/**
 * Refund confirmation email data interface
 * Contains all data needed to send a refund confirmation email
 */
export interface RefundConfirmationEmailData {
  email: string;
  fullName?: string;
  reservationNumber: string;
  refundAmount: number;
  refundId: string;
  refundDate: Date;
  currency: string;
  tripName?: string;
  tripType: string;
  reason?: string;
  isFullRefund: boolean;
  viewReservationLink?: string;
}

/**
 * Payment required email data interface
 * Contains all data needed to send a payment required email for outstanding charges
 */
export interface PaymentRequiredEmailData {
  email: string;
  fullName?: string;
  reservationNumber: string;
  chargeId: string;
  chargeDescription: string;
  amount: number;
  currency: string;
  chargeType: string;
  tripName?: string;
  tripType: string;
  paymentLink?: string;
  viewReservationLink?: string;
  dueDate?: Date;
}

