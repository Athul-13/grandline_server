/**
 * Redis service interface for temporary data storage operations
 * Primarily used for OTP (One-Time Password) management
 */
export interface IRedisService {

    setOTP(email: string, otp: string): Promise<void>;

    getOTP(email: string): Promise<string | null>;

    deleteOTP(email: string): Promise<void>;

    isConnected(): boolean;
}