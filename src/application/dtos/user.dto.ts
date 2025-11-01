import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';
import { UserRole } from '../../shared/constants';

/**
 * Request DTO for user registration
 * Validates input data before processing
 */ 
export class RegisterUserRequest {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number'
  })
  password!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, {
    message: 'Phone number must be exactly 10 digits',
  })
  phoneNumber!: string;
}

/**
 * Request DTO for user login
 * Validates input data before processing
 */ 
export class LoginUserRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

/**
 * Request DTO for OTP verification
 * Validates input data before processing
 */ 
export class VerifyOtpRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{6}$/, {
    message: 'OTP must be exactly 6 digits',
  })
  otp!: string;
}

/**
 * Request DTO for OTP resend
 * Validates input data before processing
 */ 
export class ResendOtpRequest {
  @IsEmail()
  email!: string;
}



/**
 * Response DTO for user registration
 * Contains the result of the registration process
 */ 
export interface RegisterUserResponse {
  message: string;
  email: string;
}

/**
 * Response DTO for OTP verification
 * Contains the result of the OTP verification process
 */ 
export interface VerifyOtpResponse {
  message: string;
  email: string;
}

/**
 * Response DTO for OTP resend
 * Contains the result of the OTP resend process
 */ 
export interface ResendOtpResponse {
  message: string;
  email: string;
}

/**
 * Request DTO for refresh token
 * Contains the refresh token to generate new access token
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Response DTO for refresh token
 * Contains the new access token
 */
export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * Response DTO for user login
 * Contains the result of the login process
 */ 
export interface LoginUserResponse {
  user: {
    userId: string;
    fullName: string;
    email: string;
    role: UserRole;
    createdAt: Date;
  };
  accessToken: string; // access token
  refreshToken?: string; // refresh token
}