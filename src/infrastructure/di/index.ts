import 'reflect-metadata';
import { container } from 'tsyringe';
import { registerServices } from './services.registry';
import { registerRepositories } from './repositories.registry';
import { registerConfigDependencies } from './config.registry';
import { registerUseCases } from './use_cases.registry';
import { registerControllers } from './controllers.registry';
import { DEPENDENCY_TOKENS, SERVICE_TOKENS, REPOSITORY_TOKENS, CONFIG_TOKENS, USE_CASE_TOKENS, CONTROLLER_TOKENS } from './tokens';

/**
 * Exports DI container and tokens for use in other files
 */
export { container };
export { DEPENDENCY_TOKENS, SERVICE_TOKENS, REPOSITORY_TOKENS, CONFIG_TOKENS, USE_CASE_TOKENS, CONTROLLER_TOKENS };

/**
 * Registers all dependencies in the DI container
 * Call this once at application startup
 * Order matters: Config → Services → Repositories → Use Cases → Controllers
 */
export function registerAllDependencies(): void {
  registerConfigDependencies(); // Register first (connections needed by others)
  registerServices();
  registerRepositories();
  registerUseCases(); // Register use cases (depends on services and repositories)
  registerControllers(); // Register controllers (depends on use cases)
}
