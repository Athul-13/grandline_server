/**
 * Repository dependency injection tokens
 * Used for identifying repository implementations at runtime
 */
export const REPOSITORY_TOKENS = {
  IUserRepository: Symbol.for('IUserRepository'),
  IDriverRepository: Symbol.for('IDriverRepository'),
} as const;
