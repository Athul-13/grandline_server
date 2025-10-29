import 'reflect-metadata';
import { container } from 'tsyringe';
import { registerServices } from './services.registry';
import { registerRepositories } from './repositories.registry';
import { registerUseCases } from './use_cases.registry';

// Export container and tokens for use in other files
export { container } from 'tsyringe';
export { DEPENDENCY_TOKENS } from './tokens';

/**
 * Registers all dependencies in the DI container
 * Call this once at application startup
 * 
 * Order matters:
 * 1. Services (lowest level dependencies)
 * 2. Repositories (depend on services)
 * 3. Use Cases (depend on repositories and services)
 */
export function registerAllDependencies(): void {
  console.log('🔧 Registering dependencies...');
  
  registerServices();
  registerRepositories();
  registerUseCases();
  
  console.log('✅ All dependencies registered');
}

/**
 * Clears the DI container (useful for testing)
 */
export function clearContainer(): void {
  container.clearInstances();
  console.log('🧹 DI container cleared');
}
