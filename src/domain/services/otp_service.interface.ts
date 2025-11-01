/**
 * OTP service interface
 * Handles One-Time Password operations for user verification
 */
export interface IOTPService {
  setOTP(email: string, otp: string): Promise<void>;

  getOTP(email: string): Promise<string | null>;

  deleteOTP(email: string): Promise<void>;

  isConnected(): boolean;
}
