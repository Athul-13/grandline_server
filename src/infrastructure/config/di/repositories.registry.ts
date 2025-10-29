import { container } from 'tsyringe';
import { DEPENDENCY_TOKENS } from './tokens';
import { IUserRepository } from '../../../domain/repositories/user_repository.interface';
import { IDriverRepository } from '../../../domain/repositories/driver_repository.interface';
// import { UserRepositoryImpl } from '../../repositories/user.repository.impl';
// import { DriverRepositoryImpl } from '../../repositories/driver.repository.impl';

/**
 * Registers all repository dependencies in the DI container
 * Repositories are infrastructure implementations of domain repository interfaces
 */
export function registerRepositories(): void {
  // Register when repository implementations are created
  // container.register<IUserRepository>(
  //   DEPENDENCY_TOKENS.IUserRepository,
  //   { useClass: UserRepositoryImpl }
  // );

  // container.register<IDriverRepository>(
  //   DEPENDENCY_TOKENS.IDriverRepository,
  //   { useClass: DriverRepositoryImpl }
  // );

  console.log('✅ Repositories registered');
}
