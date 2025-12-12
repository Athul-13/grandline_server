import { vi } from 'vitest';

/**
 * Mock factory utilities
 * Provides helper functions for creating common mock patterns
 */

/**
 * Creates a mock function that returns a resolved promise with the given value
 */
export function createMockAsyncFunction<T>(returnValue: T) {
  const mockFn = vi.fn<[], Promise<T>>();
  // @ts-expect-error - Vitest's mockResolvedValue accepts the value directly
  return mockFn.mockResolvedValue(returnValue);
}

/**
 * Creates a mock function that returns a rejected promise with the given error
 */
export function createMockRejectedFunction(error: Error | string): ReturnType<typeof vi.fn<[], Promise<never>>> {
  const errorObj = error instanceof Error ? error : new Error(error);
  return vi.fn<[], Promise<never>>().mockRejectedValue(errorObj);
}

/**
 * Creates a mock repository with all methods mocked to return null/empty by default
 * Override specific methods in your tests as needed
 */
export function createMockRepository<T>(): T {
  return {
    findById: vi.fn<[string], Promise<unknown>>().mockResolvedValue(null),
    create: vi.fn<[unknown], Promise<void>>().mockResolvedValue(undefined),
    updateById: vi.fn<[string, Partial<unknown>], Promise<void>>().mockResolvedValue(undefined),
    deleteById: vi.fn<[string], Promise<void>>().mockResolvedValue(undefined),
  } as unknown as T;
}

