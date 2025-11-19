import { User } from '../../domain/entities/user.entity';
import { IUserModel } from '../database/mongodb/models/user.model';

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
      doc.role,
      doc.status,
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
