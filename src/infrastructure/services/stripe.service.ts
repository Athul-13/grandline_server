import Stripe from 'stripe';
import { STRIPE_CONFIG } from '../../shared/config';
import { logger } from '../../shared/logger';

/**
 * Stripe service
 * Initializes and exports Stripe client instance
 */
let stripeInstance: Stripe | null = null;

/**
 * Gets or creates Stripe instance
 * Uses singleton pattern to ensure only one instance exists
 */
export function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    if (!STRIPE_CONFIG.SECRET_KEY) {
      logger.warn('Stripe secret key not configured. Payment functionality will not work.');
      throw new Error('Stripe secret key is required');
    }

    stripeInstance = new Stripe(STRIPE_CONFIG.SECRET_KEY, {
      apiVersion: '2025-11-17.clover',
      typescript: true,
    });

    logger.info('Stripe client initialized');
  }

  return stripeInstance;
}
