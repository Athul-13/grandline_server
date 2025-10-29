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
        public readonly phoneNumber: string,
        private readonly password: string,
        public readonly profilePicture: string,
        public readonly isVerified: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) {}

    /**
     * Checks if the user can login
     * @returns boolean
     */
    canLogin(): boolean {
        return this.status === UserStatus.ACTIVE;
    }

    /**
     * Checks if the user is an admin
     * @returns boolean
     */
    isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }
}