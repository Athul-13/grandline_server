import { UserRole, UserStatus } from "../../shared/constants";

/**
 * User domain entity representing a user in the bus rental system
 * Contains core business logic and validation rules
 */
export class User {
    constructor(
        public readonly userId: string,
        public readonly fullName: string,
        public readonly email: string,
        public readonly role: UserRole,
        public readonly status: UserStatus,
        public readonly profilePicture: string,
        public readonly isVerified: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly phoneNumber?: string,
        private readonly password?: string,
        public readonly googleId?: string,
        public readonly isDeleted: boolean = false,
    ) {}

    /**
     * Checks if the user can login
     * INACTIVE and DELETED users cannot login
     * BLOCKED users can login but with restrictions
     * ACTIVE users can login normally
     */
    canLogin(): boolean {
        return this.status === UserStatus.ACTIVE || this.status === UserStatus.BLOCKED;
    }

    /**
     * Checks if the user is an admin
     */
    isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }

    /**
     * Checks if the user has a password set
     */
    hasPassword(): boolean {
        return !!this.password;
    }

    /**
     * Checks if the user has Google authentication linked
     */
    hasGoogleAuth(): boolean {
        return !!this.googleId;
    }

    /**
     * Checks if the user is blocked
     */
    isBlocked(): boolean {
        return this.status === UserStatus.BLOCKED;
    }
}