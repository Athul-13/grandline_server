import { Driver } from '../../domain/entities/driver.entity';
import {
  CreateDriverResponse,
  UpdateDriverResponse,
  UpdateDriverStatusResponse,
  UpdateDriverSalaryResponse,
  DriverListItem,
  ListDriversResponse,
  GetDriverByIdResponse,
  LoginDriverResponse,
  ChangeDriverPasswordResponse,
  GetDriverProfileResponse,
  UpdateProfilePictureResponse,
  UpdateLicenseCardPhotoResponse,
  UpdateOnboardingPasswordResponse,
} from '../dtos/driver.dto';
import { SUCCESS_MESSAGES } from '../../shared/constants';

/**
 * Mapper class for converting Driver entities to response DTOs
 */
export class DriverMapper {
  static toCreateDriverResponse(driver: Driver, plainPassword: string): CreateDriverResponse {
    return {
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        salary: driver.salary,
        isOnboarded: driver.isOnboarded,
        createdAt: driver.createdAt,
      },
      password: plainPassword,
    };
  }

  static toUpdateDriverResponse(driver: Driver): UpdateDriverResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_UPDATED,
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        salary: driver.salary,
        isOnboarded: driver.isOnboarded,
        updatedAt: driver.updatedAt,
      },
    };
  }

  static toUpdateDriverStatusResponse(driver: Driver): UpdateDriverStatusResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_STATUS_UPDATED,
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        status: driver.status,
        isOnboarded: driver.isOnboarded,
        updatedAt: driver.updatedAt,
      },
    };
  }

  static toUpdateDriverSalaryResponse(driver: Driver): UpdateDriverSalaryResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_SALARY_UPDATED,
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        salary: driver.salary,
        updatedAt: driver.updatedAt,
      },
    };
  }

  static toDriverListItem(driver: Driver): DriverListItem {
    return {
      driverId: driver.driverId,
      fullName: driver.fullName,
      email: driver.email,
      phoneNumber: driver.phoneNumber,
      licenseNumber: driver.licenseNumber,
      profilePictureUrl: driver.profilePictureUrl,
      licenseCardPhotoUrl: driver.licenseCardPhotoUrl,
      status: driver.status,
      salary: driver.salary,
      isOnboarded: driver.isOnboarded,
      createdAt: driver.createdAt,
      updatedAt: driver.updatedAt,
    };
  }

  static toDriverListItems(drivers: Driver[]): DriverListItem[] {
    return drivers.map(driver => this.toDriverListItem(driver));
  }

  static toListDriversResponse(
    drivers: Driver[],
    page: number,
    limit: number,
    total: number
  ): ListDriversResponse {
    return {
      drivers: this.toDriverListItems(drivers),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static toGetDriverByIdResponse(
    driver: Driver,
    stats: {
      totalRides: number;
      earnings: number;
      rating: number;
      lastPaymentDate?: Date;
    }
  ): GetDriverByIdResponse {
    return {
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        profilePictureUrl: driver.profilePictureUrl,
        licenseCardPhotoUrl: driver.licenseCardPhotoUrl,
        status: driver.status,
        salary: driver.salary,
        isOnboarded: driver.isOnboarded,
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      },
      stats: {
        totalRides: stats.totalRides,
        earnings: stats.earnings,
        rating: stats.rating,
        lastPaymentDate: stats.lastPaymentDate,
      },
    };
  }

  static toLoginDriverResponse(
    driver: Driver,
    accessToken: string,
    refreshToken?: string
  ): LoginDriverResponse {
    return {
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        profilePictureUrl: driver.profilePictureUrl,
        licenseCardPhotoUrl: driver.licenseCardPhotoUrl,
        status: driver.status,
        salary: driver.salary,
        isOnboarded: driver.isOnboarded,
        createdAt: driver.createdAt,
      },
      accessToken,
      refreshToken,
    };
  }

  static toChangeDriverPasswordResponse(): ChangeDriverPasswordResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_PASSWORD_CHANGED,
    };
  }

  static toGetDriverProfileResponse(driver: Driver): GetDriverProfileResponse {
    return {
      driver: {
        driverId: driver.driverId,
        fullName: driver.fullName,
        email: driver.email,
        phoneNumber: driver.phoneNumber,
        licenseNumber: driver.licenseNumber,
        profilePictureUrl: driver.profilePictureUrl,
        licenseCardPhotoUrl: driver.licenseCardPhotoUrl,
        status: driver.status,
        salary: driver.salary,
        isOnboarded: driver.isOnboarded,
        onboardingProgress: {
          profilePictureUploaded: driver.profilePictureUrl !== '',
          licenseCardUploaded: driver.licenseCardPhotoUrl !== '',
          isComplete: driver.hasCompletedOnboarding(),
        },
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
      },
    };
  }

  static toUpdateProfilePictureResponse(driver: Driver): UpdateProfilePictureResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_PROFILE_PICTURE_UPDATED,
      driver: {
        driverId: driver.driverId,
        profilePictureUrl: driver.profilePictureUrl,
        isOnboarded: driver.isOnboarded,
        updatedAt: driver.updatedAt,
      },
    };
  }

  static toUpdateLicenseCardPhotoResponse(driver: Driver): UpdateLicenseCardPhotoResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_LICENSE_CARD_UPDATED,
      driver: {
        driverId: driver.driverId,
        licenseCardPhotoUrl: driver.licenseCardPhotoUrl,
        isOnboarded: driver.isOnboarded,
        updatedAt: driver.updatedAt,
      },
    };
  }

  static toUpdateOnboardingPasswordResponse(): UpdateOnboardingPasswordResponse {
    return {
      message: SUCCESS_MESSAGES.DRIVER_ONBOARDING_PASSWORD_UPDATED,
    };
  }
}

