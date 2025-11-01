/**
 * Email type enumeration
 * Defines all available email types in the system
 */
export enum EmailType {
  OTP = 'OTP',
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

