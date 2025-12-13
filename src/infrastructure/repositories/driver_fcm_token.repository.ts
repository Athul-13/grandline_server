import { injectable } from 'tsyringe';
import { IDriverFcmTokenRepository } from '../../domain/repositories/driver_fcm_token_repository.interface';
import { DriverFcmToken } from '../../domain/entities/driver_fcm_token.entity';
import { IDriverFcmTokenModel, createDriverFcmTokenModel } from '../database/mongodb/models/driver_fcm_token.model';
import { MongoBaseRepository } from './base/mongo_base.repository';
import { IDatabaseModel } from '../../domain/services/mongodb_model.interface';

/**
 * DriverFcmToken repository implementation
 * Handles data persistence operations for DriverFcmToken entity using MongoDB
 */
@injectable()
export class DriverFcmTokenRepositoryImpl
  extends MongoBaseRepository<IDriverFcmTokenModel, DriverFcmToken>
  implements IDriverFcmTokenRepository {
  
  private readonly fcmTokenModel: IDatabaseModel<IDriverFcmTokenModel>;

  constructor() {
    const model = createDriverFcmTokenModel();
    super(model, 'tokenId');
    this.fcmTokenModel = model;
  }

  protected toEntity(doc: IDriverFcmTokenModel): DriverFcmToken {
    return new DriverFcmToken(
      doc.tokenId,
      doc.driverId,
      doc.fcmToken,
      doc.deviceId || null,
      doc.platform,
      doc.createdAt,
      doc.updatedAt
    );
  }

  protected toPersistence(entity: DriverFcmToken): Partial<IDriverFcmTokenModel> {
    return {
      tokenId: entity.tokenId,
      driverId: entity.driverId,
      fcmToken: entity.fcmToken,
      deviceId: entity.deviceId || undefined,
      platform: entity.platform,
    };
  }

  async findByDriverIdAndPlatform(driverId: string, platform: 'ios' | 'android'): Promise<DriverFcmToken | null> {
    const doc = await this.fcmTokenModel.findOne({ driverId, platform });
    return doc ? this.toEntity(doc) : null;
  }

  async findByDriverId(driverId: string): Promise<DriverFcmToken[]> {
    const docs = await this.fcmTokenModel.find({ driverId });
    return docs.map((doc) => this.toEntity(doc));
  }

  async findByFcmToken(fcmToken: string): Promise<DriverFcmToken | null> {
    const doc = await this.fcmTokenModel.findOne({ fcmToken });
    return doc ? this.toEntity(doc) : null;
  }

  async deleteByDriverId(driverId: string): Promise<void> {
    await this.fcmTokenModel.deleteMany({ driverId });
  }

  async deleteByFcmToken(fcmToken: string): Promise<void> {
    await this.fcmTokenModel.deleteOne({ fcmToken });
  }
}

