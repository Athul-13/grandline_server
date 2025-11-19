import { injectable } from 'tsyringe';
import { IUserRepository } from '../../domain/repositories/user_repository.interface';
import { User } from '../../domain/entities/user.entity';
import { IUserModel, createUserModel } from '../database/mongodb/models/user.model';
import { UserRepositoryMapper } from '../mappers/user_repository.mapper';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * User repository implementation
 * Handles data persistence operations for User entity using MongoDB
 * Depends on IDatabaseModel interface for abstraction (DIP)
 */
@injectable()
export class UserRepositoryImpl
  extends MongoBaseRepository<IUserModel, User>
  implements IUserRepository {

  private readonly userModel: IDatabaseModel<IUserModel>;

  constructor() {
    // Create model instance using factory
    const model = createUserModel();
    super(model);
    this.userModel = model;
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
      googleId: entity.googleId,
      role: entity.role,
      status: entity.status,
      profilePicture: entity.profilePicture,
      isVerified: entity.isVerified,
    };
  }

  async createUser(user: User, passwordHash?: string): Promise<void> {
    await this.userModel.create({
      userId: user.userId,
      fullName: user.fullName,
      email: user.email,
      password: passwordHash,
      phoneNumber: user.phoneNumber,
      googleId: user.googleId,
      role: user.role,
      status: user.status,
      profilePicture: user.profilePicture,
      isVerified: user.isVerified,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ email }, { select: '+password' });
    return doc ? this.toEntity(doc) : null;
  }

  async findByGoogleId(googleId: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ googleId });
    return doc ? this.toEntity(doc) : null;
  }

  async findById(userId: string): Promise<User | null> {
    const doc = await this.userModel.findOne({ userId }, { select: '+password' });
    return doc ? this.toEntity(doc) : null;
  }

  async findAll(): Promise<User[]> {
    const docs = await this.userModel.find({});
    return UserRepositoryMapper.toEntities(docs);
  }

  async updateVerificationStatus(userId: string, isVerified: boolean): Promise<User> {
    await this.userModel.updateOne(
      { userId },
      { $set: { isVerified } }
    );

    const updatedDoc = await this.userModel.findOne({ userId });
    if (!updatedDoc) {
      throw new Error(`User with id ${userId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }

  async getPasswordHash(userId: string): Promise<string> {
    const doc = await this.userModel.findOne({ userId }, { select: '+password' });

    if (!doc || !doc.password) {
      throw new Error(`Password hash not found for user ${userId}`);
    }

    return doc.password;
  }

  async updatePassword(userId: string, passwordHash: string): Promise<void> {
    const result = await this.userModel.updateOne(
      { userId },
      { $set: { password: passwordHash } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`User with id ${userId} not found`);
    }
  }

  async linkGoogleAccount(userId: string, googleId: string): Promise<User> {
    const result = await this.userModel.updateOne(
      { userId },
      { $set: { googleId } }
    );

    if (result.matchedCount === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    const updatedDoc = await this.userModel.findOne({ userId });
    if (!updatedDoc) {
      throw new Error(`User with id ${userId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }

  async updateUserProfile(userId: string, updates: { fullName?: string; phoneNumber?: string; profilePicture?: string }): Promise<User> {
    const updateData: Partial<IUserModel> = {};
    
    if (updates.fullName !== undefined) {
      updateData.fullName = updates.fullName;
    }
    if (updates.phoneNumber !== undefined) {
      updateData.phoneNumber = updates.phoneNumber;
    }
    if (updates.profilePicture !== undefined) {
      updateData.profilePicture = updates.profilePicture;
    }

    // Add updatedAt timestamp
    updateData.updatedAt = new Date();

    const result = await this.userModel.updateOne(
      { userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      throw new Error(`User with id ${userId} not found`);
    }

    const updatedDoc = await this.userModel.findOne({ userId });
    if (!updatedDoc) {
      throw new Error(`User with id ${userId} not found after update`);
    }

    return this.toEntity(updatedDoc);
  }
}
