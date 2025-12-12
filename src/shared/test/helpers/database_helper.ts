import mongoose from 'mongoose';

/**
 * Database helper utilities for integration tests
 * Provides functions for managing test database connections
 */

const TEST_DB_URI = process.env.TEST_DATABASE_URL || 'mongodb://localhost:27017/test_db';

/**
 * Connects to the test database
 * Call this in beforeAll or beforeEach for integration tests
 */
export async function connectTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState === mongoose.ConnectionStates.disconnected) {
    await mongoose.connect(TEST_DB_URI);
  }
}

/**
 * Disconnects from the test database
 * Call this in afterAll or afterEach for integration tests
 */
export async function disconnectTestDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== mongoose.ConnectionStates.disconnected) {
    await mongoose.disconnect();
  }
}

/**
 * Clears all collections in the test database
 * Useful for cleaning up between tests
 */
export async function clearTestDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Drops all collections in the test database
 * More aggressive cleanup - use when you need a completely fresh database
 */
export async function dropTestDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].drop();
  }
}

