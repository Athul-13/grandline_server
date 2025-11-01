import { SERVICE_TOKENS } from './services.tokens';
import { REPOSITORY_TOKENS } from './repositories.tokens';
import { CONFIG_TOKENS } from './config.tokens';
import { USE_CASE_TOKENS } from './use_cases.tokens';
import { CONTROLLER_TOKENS } from './controllers.tokens';

/**
 * All dependency injection tokens
 * Centralized export of all tokens organized by layer
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
