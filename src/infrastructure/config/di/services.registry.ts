import { container } from 'tsyringe';
import { DEPENDENCY_TOKENS } from './tokens';
import { IRedisService } from '../../../domain/services/redis_service.interface';
import { RedisServiceImpl } from '../../service/redis.service';

/**
 * Registers all service dependencies in the DI container
 * Services are infrastructure implementations of domain interfaces
 */
export function registerServices(): void {
  container.register<IRedisService>(
    DEPENDENCY_TOKENS.IRedisService,
    { useClass: RedisServiceImpl }
  );

  console.log('✅ Services registered');
}
