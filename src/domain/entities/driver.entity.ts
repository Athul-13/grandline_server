import { DriverStatus } from '../../shared/constants';

/**
 * Driver domain entity representing a driver in the bus rental system
 * Contains core business logic and validation rules
 */
export class Driver {
  constructor(
    public readonly driverId: string,
    public readonly fullName: string,
    public readonly profilePictureUrl: string,
    public readonly email: string,
    public readonly phoneNumber: string,
    private readonly password: string,
    public readonly licenseNumber: string,
    public readonly licenseCardPhotoUrl: string,
    public readonly status: DriverStatus,
    public readonly salary: number,
    public readonly isOnboarded: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly lastAssignedAt?: Date
  ) {}

  canLogin(): boolean {
    return this.status !== DriverStatus.BLOCKED;
  }

  isAvailable(): boolean {
    return this.status === DriverStatus.AVAILABLE;
  }

  isOnTrip(): boolean {
    return this.status === DriverStatus.ON_TRIP;
  }

  canAcceptRide(): boolean {
    return this.isOnboarded && this.status === DriverStatus.AVAILABLE;
  }

  isSuspended(): boolean {
    return this.status === DriverStatus.SUSPENDED;
  }
  
  isBlocked(): boolean {
    return this.status === DriverStatus.BLOCKED;
  }

  hasCompletedOnboarding(): boolean {
    return this.profilePictureUrl !== '' && 
           this.licenseCardPhotoUrl !== '' && 
           this.isOnboarded;
  }
}