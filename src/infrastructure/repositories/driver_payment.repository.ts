import { injectable } from "tsyringe";
import { MongoBaseRepository } from "./base/mongo_base.repository";
import { createDriverPaymentModel, IDriverPaymentModel } from "../database/mongodb/models/driver_payment.model";
import { IDriverPaymentRepository } from "../../domain/repositories/driver_payment_repository.interface";
import { IDatabaseModel } from "../../domain/services/mongodb_model.interface";
import { DriverPayment } from "../../domain/entities/driver_payment.entity";
import { DriverPaymentRepositoryMapper } from "../mappers/driver_payment_repository.mapper";

@injectable()
export class DriverPaymentRepositoryImpl
    extends MongoBaseRepository<IDriverPaymentModel, DriverPayment>
    implements IDriverPaymentRepository {

        private readonly driverPaymentModel: IDatabaseModel<IDriverPaymentModel>;

        constructor() {
            const model = createDriverPaymentModel();
            super(model, 'paymentId');
            this.driverPaymentModel = model;
        }

        protected toEntity(doc: IDriverPaymentModel): DriverPayment {
            return DriverPaymentRepositoryMapper.toEntity(doc);
        }

        protected toPersistence(entity: DriverPayment): Partial<IDriverPaymentModel> {
            return {
                paymentId: entity.paymentId,
                driverId: entity.driverId,
                reservationId: entity.reservationId,
                amount: entity.amount,
            };
        }

        async createDriverPayment(driverPayment: DriverPayment): Promise<void> {
            await this.driverPaymentModel.create(this.toPersistence(driverPayment));
        }

        async findDriverPaymentsByDriverId(driverId: string): Promise<DriverPayment[]> {
            const docs = await this.driverPaymentModel.find({ driverId });
            return DriverPaymentRepositoryMapper.toEntities(docs);
        }

        async findDriverPaymentsByReservationId(reservationId: string): Promise<DriverPayment[]> {
            const docs = await this.driverPaymentModel.find({ reservationId });
            return DriverPaymentRepositoryMapper.toEntities(docs);
        }
    }