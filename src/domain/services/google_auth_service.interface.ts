/**
 * Google user information extracted from verified ID token
 */
export interface GoogleUserInfo {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * Google Auth service interface
 * Handles verification of Google ID tokens
 */
export interface IGoogleAuthService {
  /**
   * Verifies a Google ID token and extracts user information
   */
  verifyIdToken(idToken: string): Promise<GoogleUserInfo>;
}

