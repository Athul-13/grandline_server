import { Response } from 'express';
import { APP_CONFIG, JWT_CONFIG } from '../config';
import { COOKIE_NAMES } from '../constants';
import ms from 'ms';

/**
 * Cookie security configuration
 */
const COOKIE_SECURITY = {
  HTTP_ONLY: true,
  SECURE: APP_CONFIG.NODE_ENV === 'production', // Only in production (HTTPS required)
  SAME_SITE: APP_CONFIG.NODE_ENV === 'production' ? 'none' : 'strict',
  PATH: '/',
} as const;

/**
 * Converts JWT expiry string (e.g., '15m', '7d') to milliseconds for cookie maxAge
 */
function expiryToMaxAge(expiryString: string): number {
  return ms(expiryString as ms.StringValue);
}

/**
 * Sets HTTP-only cookie for access token
 */
export function setAccessTokenCookie(res: Response, token: string): void {
  const maxAge = expiryToMaxAge(JWT_CONFIG.ACCESS_TOKEN_EXPIRY);
  res.cookie(COOKIE_NAMES.ACCESS_TOKEN, token, {
    httpOnly: COOKIE_SECURITY.HTTP_ONLY,
    secure: COOKIE_SECURITY.SECURE,
    sameSite: COOKIE_SECURITY.SAME_SITE,
    path: COOKIE_SECURITY.PATH,
    maxAge,
  });
}

/**
 * Sets HTTP-only cookie for refresh token
 */
export function setRefreshTokenCookie(res: Response, token: string): void {
  const maxAge = expiryToMaxAge(JWT_CONFIG.REFRESH_TOKEN_EXPIRY);
  res.cookie(COOKIE_NAMES.REFRESH_TOKEN, token, {
    httpOnly: COOKIE_SECURITY.HTTP_ONLY,
    secure: COOKIE_SECURITY.SECURE,
    sameSite: COOKIE_SECURITY.SAME_SITE,
    path: COOKIE_SECURITY.PATH,
    maxAge,
  });
}

/**
 * Clears access token cookie (logout/revoke)
 */
export function clearAccessTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, {
    httpOnly: COOKIE_SECURITY.HTTP_ONLY,
    secure: COOKIE_SECURITY.SECURE,
    sameSite: COOKIE_SECURITY.SAME_SITE,
    path: COOKIE_SECURITY.PATH,
  });
}

/**
 * Clears refresh token cookie (logout/revoke)
 */
export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, {
    httpOnly: COOKIE_SECURITY.HTTP_ONLY,
    secure: COOKIE_SECURITY.SECURE,
    sameSite: COOKIE_SECURITY.SAME_SITE,
    path: COOKIE_SECURITY.PATH,
  });
}

/**
 * Clears both access and refresh token cookies
 */
export function clearAllAuthCookies(res: Response): void {
  clearAccessTokenCookie(res);
  clearRefreshTokenCookie(res);
}

