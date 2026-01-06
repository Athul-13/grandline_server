import { injectable, inject } from 'tsyringe';
import { IExportReservationCSVUseCase } from '../../../interface/admin/reservation/export_reservation_csv_use_case.interface';
import { IGetAdminReservationUseCase } from '../../../interface/admin/reservation/get_admin_reservation_use_case.interface';
import { USE_CASE_TOKENS } from '../../../../di/tokens';
import { ERROR_MESSAGES, TripType } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';

/**
 * Use case for exporting reservation to CSV
 * Generates a CSV string with all reservation details
 */
@injectable()
export class ExportReservationCSVUseCase implements IExportReservationCSVUseCase {
  constructor(
    @inject(USE_CASE_TOKENS.GetAdminReservationUseCase)
    private readonly getAdminReservationUseCase: IGetAdminReservationUseCase
  ) {}

  async execute(reservationId: string): Promise<string> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Get reservation details
    const reservationDetails = await this.getAdminReservationUseCase.execute(reservationId);

    // Format date helper
    const formatDate = (date: Date | string | undefined): string => {
      if (!date) return 'N/A';
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    };

    // Escape CSV field
    const escapeCSV = (field: string | number | undefined): string => {
      if (field === undefined || field === null) return '';
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    // Build CSV rows
    const rows: string[] = [];

    // Header
    rows.push('Reservation Export');
    rows.push(`Generated: ${formatDate(new Date())}`);
    rows.push('');

    // Basic Information
    rows.push('Basic Information');
    rows.push('Field,Value');
    rows.push(`Reservation ID,${escapeCSV(reservationDetails.reservationId)}`);
    if (reservationDetails.tripName) {
      rows.push(`Trip Name,${escapeCSV(reservationDetails.tripName)}`);
    }
    rows.push(`Status,${escapeCSV(reservationDetails.status)}`);
    rows.push(`Trip Type,${escapeCSV(reservationDetails.tripType === TripType.ONE_WAY ? 'One Way' : 'Round Trip')}`);
    if (reservationDetails.passengerCount) {
      rows.push(`Passengers,${escapeCSV(reservationDetails.passengerCount)}`);
    }
    rows.push(`Created Date,${escapeCSV(formatDate(reservationDetails.createdAt))}`);
    rows.push('');

    // User Information
    if (reservationDetails.user) {
      rows.push('User Information');
      rows.push('Field,Value');
      rows.push(`Name,${escapeCSV(reservationDetails.user.fullName)}`);
      rows.push(`Email,${escapeCSV(reservationDetails.user.email)}`);
      if (reservationDetails.user.phoneNumber) {
        rows.push(`Phone,${escapeCSV(reservationDetails.user.phoneNumber)}`);
      }
      rows.push('');
    }

    // Payment Information
    if (reservationDetails.originalPricing) {
      rows.push('Payment Information');
      rows.push('Field,Value');
      rows.push(
        `Total Amount,${escapeCSV(reservationDetails.originalPricing.total || 0)} ${reservationDetails.originalPricing.currency || 'INR'}`
      );
      if (reservationDetails.originalPricing.paidAt) {
        rows.push(`Paid Date,${escapeCSV(formatDate(reservationDetails.originalPricing.paidAt))}`);
      }
      if (reservationDetails.refundedAmount && reservationDetails.refundedAmount > 0) {
        rows.push(
          `Refunded Amount,${escapeCSV(reservationDetails.refundedAmount)} ${reservationDetails.originalPricing.currency || 'INR'}`
        );
      }
      rows.push('');
    }

    // Additional Charges
    if (reservationDetails.charges && reservationDetails.charges.length > 0) {
      rows.push('Additional Charges');
      rows.push('Description,Amount,Currency,Type,Status,Paid Date');
      reservationDetails.charges.forEach((charge) => {
        rows.push(
          `${escapeCSV(charge.description)},${escapeCSV(charge.amount)},${escapeCSV(charge.currency)},${escapeCSV(charge.chargeType)},${escapeCSV(charge.isPaid ? 'Paid' : 'Unpaid')},${escapeCSV(formatDate(charge.paidAt))}`
        );
      });
      rows.push('');
    }

    // Modifications
    if (reservationDetails.modifications && reservationDetails.modifications.length > 0) {
      rows.push('Modification History');
      rows.push('Date,Type,Description,Previous Value,New Value');
      reservationDetails.modifications.forEach((mod) => {
        rows.push(
          `${escapeCSV(formatDate(mod.createdAt))},${escapeCSV(mod.modificationType)},${escapeCSV(mod.description)},${escapeCSV(mod.previousValue || '')},${escapeCSV(mod.newValue || '')}`
        );
      });
      rows.push('');
    }

    logger.info(`Generated CSV export for reservation: ${reservationId}`);

    return rows.join('\n');
  }
}

