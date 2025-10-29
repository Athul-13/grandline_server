import { User } from "../../domain/entities/user.entity";
import { LoginUserResponse, RegisterUserResponse, VerifyOtpResponse } from "../dtos/user.dto";


/**
 * Mapper class for converting User entities to response DTOs
 * Follows the Mapper pattern to separate entity structure from API response structure
 */
export class UserMapper {
    static toRegisterUserResponse(user: User): RegisterUserResponse {
        return {
            message: 'User registered successfully. Please verify using otp',
            email: user.email,
        };
    }

    static toLoginResponse(user: User, token: string): LoginUserResponse {
        return {
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            token: token,
        };
    }

    static toVerifyOtpResponse(user: User): VerifyOtpResponse {
        return {
            message: 'OTP verified successfully',
            email: user.email,
        };
    }
}