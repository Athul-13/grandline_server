/**
 * Dependency injection tokens
 * Used to identify dependencies at runtime (TypeScript interfaces don't exist at runtime)
 * 
 * Why tokens?
 * - Interfaces are compile-time only, erased at runtime
 * - Symbols ensure unique identification
 * - Prevents naming conflicts
 */
export const DEPENDENCY_TOKENS = {
  // Service tokens
  IRedisService: Symbol.for('IRedisService'),

  // Repository tokens
  IUserRepository: Symbol.for('IUserRepository'),
  IDriverRepository: Symbol.for('IDriverRepository'),

  // Use case tokens (add when use cases are created)
  // RegisterUserUseCase: Symbol.for('RegisterUserUseCase'),
  // VerifyOtpUseCase: Symbol.for('VerifyOtpUseCase'),
  // LoginUserUseCase: Symbol.for('LoginUserUseCase'),
} as const;
