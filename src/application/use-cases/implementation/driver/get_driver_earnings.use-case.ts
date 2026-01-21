import { injectable, inject } from 'tsyringe';
import { IDriverPaymentRepository } from '../../../../domain/repositories/driver_payment_repository.interface';
import { IReservationRepository } from '../../../../domain/repositories/reservation_repository.interface';
import { REPOSITORY_TOKENS } from '../../../di/tokens';
import { logger } from '../../../../shared/logger';
import { AppError } from '../../../../shared/utils/app_error.util';
import { ERROR_MESSAGES, ERROR_CODES } from '../../../../shared/constants';
import { IGetDriverEarningsUseCase } from '../../interface/driver/get_driver_earnings_use_case.interface';
import { GetDriverEarningsRequest, GetDriverEarningsResponse, DriverEarningsItem } from '../../../dtos/driver.dto';

/**
 * Use case for getting driver earnings history
 * Returns paginated list of driver payments with trip details
 */
@injectable()
export class GetDriverEarningsUseCase implements IGetDriverEarningsUseCase {
  constructor(
    @inject(REPOSITORY_TOKENS.IDriverPaymentRepository)
    private readonly driverPaymentRepository: IDriverPaymentRepository,
    @inject(REPOSITORY_TOKENS.IReservationRepository)
    private readonly reservationRepository: IReservationRepository
  ) {}

  async execute(request: GetDriverEarningsRequest): Promise<GetDriverEarningsResponse> {
    // Input validation
    if (!request.driverId || typeof request.driverId !== 'string' || request.driverId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, ERROR_CODES.INVALID_DRIVER_ID, 400);
    }

    // Set defaults for pagination
    const page = request.page && request.page > 0 ? request.page : 1;
    const limit = request.limit && request.limit > 0 && request.limit <= 100 ? request.limit : 20;

    logger.info(`Fetching driver earnings for driver: ${request.driverId}, page: ${page}, limit: ${limit}`);

    // Build date filter if provided
    const dateFilter: Record<string, unknown> = {};
    if (request.startDate) {
      const startDate = new Date(request.startDate);
      if (isNaN(startDate.getTime())) {
        throw new AppError('Invalid startDate format', 'INVALID_DATE_FORMAT', 400);
      }
      dateFilter.createdAt = { ...dateFilter.createdAt as Record<string, unknown>, $gte: startDate };
    }
    if (request.endDate) {
      const endDate = new Date(request.endDate);
      if (isNaN(endDate.getTime())) {
        throw new AppError('Invalid endDate format', 'INVALID_DATE_FORMAT', 400);
      }
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { ...dateFilter.createdAt as Record<string, unknown>, $lte: endDate };
    }

    // Get all driver payments (we'll paginate after joining with reservations)
    const driverPayments = await this.driverPaymentRepository.findDriverPaymentsByDriverId(request.driverId);

    // Filter by date if provided
    let filteredPayments = driverPayments;
    if (request.startDate || request.endDate) {
      filteredPayments = driverPayments.filter((payment) => {
        const paymentDate = payment.createdAt;
        if (request.startDate && paymentDate < new Date(request.startDate)) {
          return false;
        }
        if (request.endDate) {
          const endDate = new Date(request.endDate);
          endDate.setHours(23, 59, 59, 999);
          if (paymentDate > endDate) {
            return false;
          }
        }
        return true;
      });
    }

    // Sort by newest first (createdAt descending)
    filteredPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Calculate pagination
    const total = filteredPayments.length;
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;
    const paginatedPayments = filteredPayments.slice(skip, skip + limit);

    // Fetch reservation details for each payment
    const earningsItems: DriverEarningsItem[] = await Promise.all(
      paginatedPayments.map(async (payment) => {
        const reservation = await this.reservationRepository.findById(payment.reservationId);
        
        return {
          paymentId: payment.paymentId,
          reservationId: payment.reservationId,
          amount: payment.amount,
          createdAt: payment.createdAt,
          tripDetails: {
            tripName: reservation?.tripName,
            reservationDate: reservation?.reservationDate || reservation?.createdAt || payment.createdAt,
            status: reservation?.status || 'UNKNOWN',
          },
        };
      })
    );

    logger.info(`Retrieved ${earningsItems.length} earnings records for driver: ${request.driverId}`);

    return {
      earnings: earningsItems,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}
