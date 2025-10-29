import { User } from "../entities/user.entity";

/**
 * Repository interface for User entity operations
 * Defines the contract for data access layer implementations
 * 
 */
export interface IUserRepository {
    findByEmail(email: string): Promise<User | null>;

    findById(userId: string): Promise<User | null>;

    save(user: User): Promise<void>;

    updateVerificationStatus(userId: string, isVerified: boolean): Promise<void>;
}