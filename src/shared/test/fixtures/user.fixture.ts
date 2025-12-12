import { User } from '../../../domain/entities/user.entity';
import { UserRole, UserStatus } from '../../../shared/constants';
import { v4 as uuidv4 } from 'uuid';

/**
 * Test fixture factory for User entity
 * Provides helper functions to create User instances for testing
 */

interface UserFixtureOptions {
  userId?: string;
  email?: string;
  fullName?: string;
  phoneNumber?: string;
  role?: UserRole;
  status?: UserStatus;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Creates a User fixture with default values
 * Override specific properties as needed for your test
 */
export function createUserFixture(options: UserFixtureOptions = {}): User {
  const now = new Date();
  const userId = options.userId || uuidv4();
  const email = options.email || `test-${userId}@example.com`;

  return new User(
    userId,
    options.fullName || 'Test User',
    email,
    options.role || UserRole.USER,
    options.status || UserStatus.ACTIVE,
    '', // profilePicture
    options.isEmailVerified !== undefined ? options.isEmailVerified : true,
    options.createdAt || now,
    options.updatedAt || now,
    options.phoneNumber
  );
}

