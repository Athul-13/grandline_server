import { injectable } from 'tsyringe';
import { OAuth2Client } from 'google-auth-library';
import { IGoogleAuthService, GoogleUserInfo } from '../../domain/services/google_auth_service.interface';
import { ERROR_MESSAGES } from '../../shared/constants';
import { logger } from '../../shared/logger';

/**
 * Google Auth service implementation
 * Verifies Google ID tokens using google-auth-library
 */
@injectable()
export class GoogleAuthServiceImpl implements IGoogleAuthService {
  private readonly client: OAuth2Client;

  constructor() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      logger.warn('GOOGLE_CLIENT_ID not set in environment variables');
    }
    this.client = new OAuth2Client(clientId);
  }

  async verifyIdToken(idToken: string): Promise<GoogleUserInfo> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN);
      }

      const googleId = payload.sub;
      const email = payload.email;
      const name = payload.name || '';
      const picture = payload.picture;

      if (!googleId || !email) {
        throw new Error(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN);
      }

      return {
        googleId,
        email: email.toLowerCase(),
        name,
        picture,
      };
    } catch (error) {
      logger.error('Google token verification failed:', error);
      if (error instanceof Error && error.message === ERROR_MESSAGES.INVALID_GOOGLE_TOKEN) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.INVALID_GOOGLE_TOKEN);
    }
  }
}

