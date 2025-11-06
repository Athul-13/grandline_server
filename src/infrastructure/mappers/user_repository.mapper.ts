import { User } from '../../domain/entities/user.entity';
import { IUserModel } from '../database/mongodb/models/user.model';
import { UserRole, UserStatus } from '../../shared/constants';

/**
 * Repository mapper for User entity
 * Converts MongoDB documents to domain entities
 */
export class UserRepositoryMapper {

  static toEntity(doc: IUserModel): User {
    return new User(
      doc.userId,
      doc.fullName,
      doc.email,
      doc.role as UserRole,
      doc.status as UserStatus,
      doc.profilePicture || '',
      doc.isVerified,
      doc.createdAt,
      doc.updatedAt,
      doc.phoneNumber,
      doc.password,
      doc.googleId
    );
  }

  static toEntities(docs: IUserModel[]): User[] {
    return docs.map(doc => this.toEntity(doc));
  }
}
