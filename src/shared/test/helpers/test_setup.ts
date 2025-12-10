import 'reflect-metadata';
import { container } from 'tsyringe';

/**
 * Global test setup utilities
 * Provides helper functions for configuring the DI container in tests
 */

/**
 * Clears all registrations from the DI container
 * Call this in beforeEach or afterEach to ensure test isolation
 */
export function clearContainer(): void {
  container.clearInstances();
}

/**
 * Resets the container to its initial state
 * Useful for integration tests that need a clean state
 */
export function resetContainer(): void {
  container.clearInstances();
}

/**
 * Creates a child container for isolated test scenarios
 * Useful when you need to register test-specific dependencies
 */
export function createTestContainer() {
  return container.createChildContainer();
}

