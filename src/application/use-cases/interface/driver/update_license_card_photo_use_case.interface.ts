import { UpdateLicenseCardPhotoRequest, UpdateLicenseCardPhotoResponse } from '../../../dtos/driver.dto';

export interface IUpdateLicenseCardPhotoUseCase {
  execute(driverId: string, request: UpdateLicenseCardPhotoRequest): Promise<UpdateLicenseCardPhotoResponse>;
}

