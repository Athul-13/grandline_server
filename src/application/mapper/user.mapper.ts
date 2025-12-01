import { User } from "../../domain/entities/user.entity";
import { LoginUserResponse, RegisterUserResponse, VerifyOtpResponse, ResendOtpResponse, LogoutUserResponse, ForgotPasswordResponse, ResetPasswordResponse, GetUserProfileResponse, UpdateUserProfileResponse, GetUserByIdResponse, ChangeUserStatusResponse } from "../dtos/user.dto";
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

    static toLogoutResponse(): LogoutUserResponse {
        return {
            message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
        };
    }

    static toForgotPasswordResponse(user: User): ForgotPasswordResponse {
        return {
            message: SUCCESS_MESSAGES.PASSWORD_RESET_EMAIL_SENT,
            email: user.email,
        };
    }

    static toResetPasswordResponse(): ResetPasswordResponse {
        return {
            message: SUCCESS_MESSAGES.PASSWORD_RESET_SUCCESS,
        };
    }

    static toGetUserProfileResponse(user: User): GetUserProfileResponse {
        return {
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                role: user.role,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                hasPassword: user.hasPassword(),
                hasGoogleAuth: user.hasGoogleAuth(),
            },
        };
    }

    static toUpdateUserProfileResponse(user: User): UpdateUserProfileResponse {
        return {
            message: 'Profile updated successfully',
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                role: user.role,
                updatedAt: user.updatedAt,
            },
        };
    }

    static toGetUserByIdResponse(user: User): GetUserByIdResponse {
        return {
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                hasPassword: user.hasPassword(),
                hasGoogleAuth: user.hasGoogleAuth(),
            },
        };
    }

    static toChangeUserStatusResponse(user: User): ChangeUserStatusResponse {
        return {
            message: SUCCESS_MESSAGES.USER_STATUS_UPDATED,
            user: {
                userId: user.userId,
                fullName: user.fullName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                profilePicture: user.profilePicture,
                role: user.role,
                status: user.status,
                isVerified: user.isVerified,
                updatedAt: user.updatedAt,
            },
        };
    }
}