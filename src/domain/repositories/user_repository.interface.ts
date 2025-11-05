import { User } from "../entities/user.entity";
import { IBaseRepository } from "./base_repository.interface";

/**
 * Repository interface for User entity operations
 * Defines the contract for data access layer implementations
 * 
 */
export interface IUserRepository extends IBaseRepository<User> {
    findByEmail(email: string): Promise<User | null>;

    updateVerificationStatus(userId: string, isVerified: boolean): Promise<User>;

    createUser(user: User, passwordHash: string): Promise<void>;

    getPasswordHash(userId: string): Promise<string>;

    updatePassword(userId: string, passwordHash: string): Promise<void>;

    updateUserProfile(userId: string, updates: { fullName?: string; phoneNumber?: string; profilePicture?: string }): Promise<User>;
}