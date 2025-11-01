/**
 * Token blacklist service interface
 * Handles blacklisting of JWT tokens for logout and user blocking
 */
export interface ITokenBlacklistService {
  blacklistToken(token: string, expiryTime: number): Promise<void>;

  isTokenBlacklisted(token: string): Promise<boolean>;

  removeFromBlacklist(token: string): Promise<void>;
}
