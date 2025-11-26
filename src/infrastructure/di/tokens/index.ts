// Import tokens from Application layer
import { REPOSITORY_TOKENS, SERVICE_TOKENS, USE_CASE_TOKENS } from '../../../application/di/tokens';
// Import infrastructure-specific tokens
import { CONFIG_TOKENS } from './config.tokens';
import { CONTROLLER_TOKENS } from './controllers.tokens';

/**
 * All dependency injection tokens
 * Centralized export of all tokens organized by layer
 * Repository, Service, and Use Case tokens are from Application layer
 * Config and Controller tokens are from Infrastructure layer
 */
export const DEPENDENCY_TOKENS = {
  ...SERVICE_TOKENS,
  ...REPOSITORY_TOKENS,
  ...CONFIG_TOKENS,
  ...USE_CASE_TOKENS,
  ...CONTROLLER_TOKENS,
} as const;

// Also export individual token groups for convenience
export { SERVICE_TOKENS, REPOSITORY_TOKENS, CONFIG_TOKENS, USE_CASE_TOKENS, CONTROLLER_TOKENS };
