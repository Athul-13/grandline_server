import { injectable } from 'tsyringe';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { User } from '../../domain/entities/user.entity';
import { UserDB, IUserModel } from '../database/mongoModels/user.model';
import { UserRepositoryMapper } from '../mappers/user-repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';

/**
 * User repository implementation
 * Handles data persistence operations for User entity using MongoDB
 */
@injectable()
export class UserRepositoryImpl
  extends MongoBaseRepository<IUserModel, User>
  implements IUserRepository {

  constructor() {
    super(UserDB);
  }

  protected toEntity(doc: IUserModel): User {
    return UserRepositoryMapper.toEntity(doc);
  }

  protected toPersistence(entity: User): Partial<IUserModel> {
    return {
      userId: entity.userId,
      fullName: entity.fullName,
      email: entity.email,
      phoneNumber: entity.phoneNumber,
      role: entity.role,
      status: entity.status,
      profilePicture: entity.profilePicture,
      isVerified: entity.isVerified,
    };
  }

  async createUser(user: User, passwordHash: string): Promise<void> {
    await UserDB.create({
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      password: passwordHash,
      phoneNumber: user.phoneNumber,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await UserDB.findOne({ email })
      .select('+password')
      .lean<IUserModel>()
      .exec();

    return doc ? this.toEntity(doc) : null;
  }

  async findById(userId: string): Promise<User | null> {
    return await super.findById(userId);
  }

  async updateVerificationStatus(userId: string, isVerified: boolean): Promise<User> {
    await UserDB.updateOne(
      { userId },
      { $set: { isVerified } }
    ).exec();

    const updatedDoc = await UserDB.findOne({ userId }).lean<IUserModel>().exec();
    if (!updatedDoc) {
      throw new Error(`User with id ${userId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }

  async getPasswordHash(userId: string): Promise<string> {
    const doc = await UserDB.findOne({ userId })
      .select('+password')
      .lean<IUserModel>()
      .exec();

    if (!doc || !doc.password) {
      throw new Error(`Password hash not found for user ${userId}`);
    }

    return doc.password;
  }
}
