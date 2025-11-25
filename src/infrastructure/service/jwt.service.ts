import { injectable, inject } from 'tsyringe';
import { IJWTService, JWTPayload, TokenPair } from '../../domain/services/jwt_service.interface';
import { ITokenBlacklistService } from '../../domain/services/token_blacklist_service.interface';
import { SERVICE_TOKENS } from '../../application/di/tokens';
import { APP_CONFIG, JWT_CONFIG } from '../../shared/config';
import jwt, { Secret } from 'jsonwebtoken';
import type { StringValue } from 'ms';

/**
 * JWT service implementation
 * Handles access tokens, refresh tokens, and token blacklisting
 */
@injectable()
export class JWTServiceImpl implements IJWTService {
  constructor(
    @inject(SERVICE_TOKENS.ITokenBlacklistService)
    private tokenBlacklistService: ITokenBlacklistService,
  ) {}

  generateTokens(payload: JWTPayload): Promise<TokenPair> {
    const secret: Secret = APP_CONFIG.JWT_SECRET;
    
    // Generate access token
    const accessToken = jwt.sign(
      payload as object,
      secret,
      {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY as StringValue, // 15 minutes
      }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      payload as object,
      secret,
      {
        expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY as StringValue, // 7 days
      }
    );

    return Promise.resolve({
      accessToken,
      refreshToken,
    });
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    // Check if token is blacklisted first
    const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Token has been revoked');
    }

    const secret: Secret = APP_CONFIG.JWT_SECRET;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid access token');
      }
      throw error;
    }
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    // Check if token is blacklisted
    const isBlacklisted = await this.tokenBlacklistService.isTokenBlacklisted(token);
    if (isBlacklisted) {
      throw new Error('Refresh token has been revoked');
    }

    const secret: Secret = APP_CONFIG.JWT_SECRET;
    try {
      const decoded = jwt.verify(token, secret) as JWTPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    // Verify refresh token (also checks blacklist)
    const payload = await this.verifyRefreshToken(refreshToken);

    const secret: Secret = APP_CONFIG.JWT_SECRET;
    // Generate new access token with same payload
    const accessToken = jwt.sign(
      { userId: payload.userId, email: payload.email, role: payload.role } as object,
      secret,
      {
        expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY as StringValue, // 15 minutes
      }
    );

    return accessToken;
  }

  async blacklistToken(token: string, expiryTime: number): Promise<void> {
    await this.tokenBlacklistService.blacklistToken(token, expiryTime);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    return await this.tokenBlacklistService.isTokenBlacklisted(token);
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    // Decode to get expiry time
    const decoded = jwt.decode(refreshToken) as JWTPayload & { exp: number };
    if (!decoded || !decoded.exp) {
      throw new Error('Invalid refresh token');
    }

    // Calculate remaining time until expiry
    const currentTime = Math.floor(Date.now() / 1000);
    const expiryTime = decoded.exp - currentTime;

    // Only blacklist if token hasn't expired yet
    if (expiryTime > 0) {
      await this.tokenBlacklistService.blacklistToken(refreshToken, expiryTime);
    }
  }
}
