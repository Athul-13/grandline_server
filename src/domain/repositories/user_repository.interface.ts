import { User } from "../entities/user.entity";
import { IBaseRepository } from "./base_repository.interface";
import { UserRole, UserStatus } from "../../shared/constants";

/**
 * Repository interface for User entity operations
 * Defines the contract for data access layer implementations
 * 
 */
export interface IUserRepository extends IBaseRepository<User> {
    findAll(): Promise<User[]>;

    findByEmail(email: string): Promise<User | null>;

    findByEmailIncludingDeleted(email: string): Promise<User | null>;

    findByGoogleId(googleId: string): Promise<User | null>;

    findByRole(role: UserRole): Promise<User[]>;

    updateVerificationStatus(userId: string, isVerified: boolean): Promise<User>;

    createUser(user: User, passwordHash?: string): Promise<void>;

    getPasswordHash(userId: string): Promise<string>;

    updatePassword(userId: string, passwordHash: string): Promise<void>;

    linkGoogleAccount(userId: string, googleId: string): Promise<User>;

    updateUserProfile(userId: string, updates: { fullName?: string; phoneNumber?: string; profilePicture?: string }): Promise<User>;

    findRegularUsersWithFilters(filters: {
        status?: UserStatus[];
        isVerified?: boolean;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        page?: number;
        limit?: number;
    }): Promise<{ users: User[]; total: number }>;

    updateUserStatus(userId: string, status: UserStatus): Promise<User>;

    updateUserRole(userId: string, role: UserRole): Promise<User>;

    getUserStatistics(timeRange?: { startDate?: Date; endDate?: Date }): Promise<{
        totalUsers: number;
        activeUsers: number;
        inactiveUsers: number;
        blockedUsers: number;
        verifiedUsers: number;
        unverifiedUsers: number;
        newUsers: number;
        usersByStatus: Record<string, number>;
    }>;

    softDelete(userId: string): Promise<void>;

    /**
     * Finds users by IDs (driver dashboard / batch loading)
     * Returns a map keyed by userId.
     */
    findByIds(userIds: string[]): Promise<Map<string, User>>;
}