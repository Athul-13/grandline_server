import { User } from "../../domain/entities/user.entity";
import { LoginUserResponse, RegisterUserResponse, VerifyOtpResponse, ResendOtpResponse } from "../dtos/user.dto";
import { SUCCESS_MESSAGES } from "../../shared/constants";


/**
 * Mapper class for converting User entities to response DTOs
 */
export class UserMapper {
    static toRegisterUserResponse(user: User): RegisterUserResponse {
        return {
            message: SUCCESS_MESSAGES.USER_REGISTERED,
            email: user.email,
        };
    }

    static toLoginResponse(user: User, accessToken: string, refreshToken?: string): LoginUserResponse {
        return {
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
            accessToken,
            refreshToken,
        };
    }

    static toVerifyOtpResponse(user: User): VerifyOtpResponse {
        return {
            message: SUCCESS_MESSAGES.OTP_VERIFIED,
            email: user.email,
        };
    }

    static toResendOtpResponse(user: User): ResendOtpResponse {
        return {
            message: SUCCESS_MESSAGES.OTP_SENT,
            email: user.email,
        };
    }
}