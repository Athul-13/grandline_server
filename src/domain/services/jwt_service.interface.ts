/**
 * JWT service interface for token management
 * Handles access tokens, refresh tokens, and token blacklisting
 */

/**
 * JWT token payload structure
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Token pair containing access and refresh tokens
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT service interface for token management
 * Handles access tokens, refresh tokens, and token blacklisting
 */
export interface IJWTService {

  generateTokens(payload: JWTPayload): Promise<TokenPair>;

  verifyAccessToken(token: string): Promise<JWTPayload>;

  verifyRefreshToken(token: string): Promise<JWTPayload>;

  refreshAccessToken(refreshToken: string): Promise<string>;

  blacklistToken(token: string, expiryTime: number): Promise<void>;

  isTokenBlacklisted(token: string): Promise<boolean>;

  revokeRefreshToken(refreshToken: string): Promise<void>;
}
