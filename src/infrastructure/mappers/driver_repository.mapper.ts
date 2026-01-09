import { Driver } from '../../domain/entities/driver.entity';
import { IDriverModel } from '../database/mongodb/models/driver.model';

/**
 * Repository mapper for Driver entity
 * Converts MongoDB documents to domain entities
 */
export class DriverRepositoryMapper {

  static toEntity(doc: IDriverModel): Driver {
    return new Driver(
      doc.driverId,
      doc.fullName,
      doc.profilePictureUrl || '',
      doc.email,
      doc.phoneNumber || '',
      doc.password || '',
      doc.licenseNumber,
      doc.licenseCardPhotoUrl || '',
      doc.status,
      doc.salary,
      doc.totalEarnings || 0,
      doc.isOnboarded || false,
      doc.createdAt || null,
      doc.updatedAt || null,
      doc.lastPaymentDate,
      doc.lastAssignedAt,
    );
  }

  static toEntities(docs: IDriverModel[]): Driver[] {
    return docs.map(doc => this.toEntity(doc));
  }
}

