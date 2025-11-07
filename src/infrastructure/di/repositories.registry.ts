import { container } from 'tsyringe';
import { REPOSITORY_TOKENS } from './tokens';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { UserRepositoryImpl } from '../repositories/user.repository';
import { IVehicleTypeRepository } from '../../domain/repositories/vehicle_type_repository.interface';
import { VehicleTypeRepositoryImpl } from '../repositories/vehicle_type.repository';
import { IVehicleRepository } from '../../domain/repositories/vehicle_repository.interface';
import { VehicleRepositoryImpl } from '../repositories/vehicle.repository';

/**
 * Registers all repository dependencies in the DI container
 * Repositories are infrastructure implementations of domain repository interfaces
 */
export function registerRepositories(): void {
  container.register<IUserRepository>(
    REPOSITORY_TOKENS.IUserRepository,
    { useClass: UserRepositoryImpl }
  );

  container.register<IVehicleTypeRepository>(
    REPOSITORY_TOKENS.IVehicleTypeRepository,
    { useClass: VehicleTypeRepositoryImpl }
  );

  container.register<IVehicleRepository>(
    REPOSITORY_TOKENS.IVehicleRepository,
    { useClass: VehicleRepositoryImpl }
  );
}
