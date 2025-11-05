import { container } from 'tsyringe';
import { REPOSITORY_TOKENS } from './tokens';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { UserRepositoryImpl } from '../repositories/user.repository';

/**
 * Registers all repository dependencies in the DI container
 * Repositories are infrastructure implementations of domain repository interfaces
 */
export function registerRepositories(): void {
  container.register<IUserRepository>(
    REPOSITORY_TOKENS.IUserRepository,
    { useClass: UserRepositoryImpl }
  );
}
