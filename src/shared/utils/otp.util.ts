import { OTP_CONFIG } from '../constants';

/**
 * OTP utility functions
 * Handles one-time password generation
 */
export function generateOTP(): string {
  const min = Math.pow(10, OTP_CONFIG.LENGTH - 1); // 100000
  const max = Math.pow(10, OTP_CONFIG.LENGTH) - 1;  // 999999
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp.toString();
}
