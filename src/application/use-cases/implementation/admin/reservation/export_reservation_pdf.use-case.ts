import { injectable, inject } from 'tsyringe';
import { IExportReservationPDFUseCase } from '../../../interface/admin/reservation/export_reservation_pdf_use_case.interface';
import { IGetAdminReservationUseCase } from '../../../interface/admin/reservation/get_admin_reservation_use_case.interface';
import { IPDFGenerationService } from '../../../../../domain/services/pdf_generation_service.interface';
import { USE_CASE_TOKENS, SERVICE_TOKENS } from '../../../../di/tokens';
import { ERROR_MESSAGES, TripType } from '../../../../../shared/constants';
import { AppError } from '../../../../../shared/utils/app_error.util';
import { logger } from '../../../../../shared/logger';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');

/**
 * Use case for exporting reservation to PDF
 * Generates a comprehensive PDF document with all reservation details
 */
@injectable()
export class ExportReservationPDFUseCase implements IExportReservationPDFUseCase {
  constructor(
    @inject(USE_CASE_TOKENS.GetAdminReservationUseCase)
    private readonly getAdminReservationUseCase: IGetAdminReservationUseCase,
    @inject(SERVICE_TOKENS.IPDFGenerationService)
    private readonly pdfService: IPDFGenerationService
  ) {}

  async execute(reservationId: string): Promise<Buffer> {
    // Input validation
    if (!reservationId || typeof reservationId !== 'string' || reservationId.trim().length === 0) {
      throw new AppError(ERROR_MESSAGES.BAD_REQUEST, 'INVALID_RESERVATION_ID', 400);
    }

    // Get reservation details
    const reservationDetails = await this.getAdminReservationUseCase.execute(reservationId);

    // Generate PDF
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer: Buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (error: Error) => reject(error));

        // Format currency helper
        const formatCurrency = (amount: number, currency: string = 'INR'): string => {
          return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currency,
          }).format(amount);
        };

        // Format date helper
        const formatDate = (date: Date | string | undefined): string => {
          if (!date) return 'N/A';
          return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(date));
        };

        // Header
        doc
          .fontSize(24)
          .fillColor('#C5630C')
          .text('GRANDLINE', 50, 50, { align: 'center' });

        doc
          .fontSize(18)
          .fillColor('#1a1a1a')
          .text('Reservation Details', 50, 85, { align: 'center' });

        let yPosition = 130;

        // Basic Information
        doc.fontSize(16).fillColor('#C5630C').text('Basic Information', 50, yPosition);
        yPosition += 25;

        doc.fontSize(12).fillColor('#6b7280').text('Reservation ID:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(reservationDetails.reservationId, 200, yPosition);
        yPosition += 20;

        if (reservationDetails.tripName) {
          doc.fillColor('#6b7280').text('Trip Name:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(reservationDetails.tripName, 200, yPosition);
          yPosition += 20;
        }

        doc.fillColor('#6b7280').text('Status:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(reservationDetails.status.toUpperCase(), 200, yPosition);
        yPosition += 20;

        doc.fillColor('#6b7280').text('Trip Type:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(
          reservationDetails.tripType === TripType.ONE_WAY ? 'One Way' : 'Round Trip',
          200,
          yPosition
        );
        yPosition += 20;

        if (reservationDetails.passengerCount) {
          doc.fillColor('#6b7280').text('Passengers:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(reservationDetails.passengerCount.toString(), 200, yPosition);
          yPosition += 20;
        }

        doc.fillColor('#6b7280').text('Created Date:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(formatDate(reservationDetails.createdAt), 200, yPosition);
        yPosition += 30;

        // User Information
        if (reservationDetails.user) {
          doc.fontSize(16).fillColor('#C5630C').text('User Information', 50, yPosition);
          yPosition += 25;

          doc.fontSize(12).fillColor('#6b7280').text('Name:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(reservationDetails.user.fullName, 200, yPosition);
          yPosition += 20;

          doc.fillColor('#6b7280').text('Email:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(reservationDetails.user.email, 200, yPosition);
          yPosition += 20;

          if (reservationDetails.user.phoneNumber) {
            doc.fillColor('#6b7280').text('Phone:', 50, yPosition);
            doc.fillColor('#1a1a1a').text(reservationDetails.user.phoneNumber, 200, yPosition);
            yPosition += 20;
          }
          yPosition += 10;
        }

        // Payment Information
        if (reservationDetails.originalPricing) {
          doc.fontSize(16).fillColor('#C5630C').text('Payment Information', 50, yPosition);
          yPosition += 25;

          doc.fontSize(12).fillColor('#6b7280').text('Total Amount:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(
            formatCurrency(reservationDetails.originalPricing.total || 0, reservationDetails.originalPricing.currency || 'INR'),
            200,
            yPosition
          );
          yPosition += 20;

          if (reservationDetails.originalPricing.paidAt) {
            doc.fillColor('#6b7280').text('Paid Date:', 50, yPosition);
            doc.fillColor('#1a1a1a').text(formatDate(reservationDetails.originalPricing.paidAt), 200, yPosition);
            yPosition += 20;
          }

          if (reservationDetails.refundedAmount && reservationDetails.refundedAmount > 0) {
            doc.fillColor('#6b7280').text('Refunded Amount:', 50, yPosition);
            doc.fillColor('#1a1a1a').text(
              formatCurrency(reservationDetails.refundedAmount, reservationDetails.originalPricing.currency || 'INR'),
              200,
              yPosition
            );
            yPosition += 20;
          }
          yPosition += 10;
        }

        // Additional Charges
        if (reservationDetails.charges && reservationDetails.charges.length > 0) {
          doc.fontSize(16).fillColor('#C5630C').text('Additional Charges', 50, yPosition);
          yPosition += 25;

          reservationDetails.charges.forEach((charge) => {
            doc.fontSize(12).fillColor('#6b7280').text(`${charge.description}:`, 50, yPosition);
            doc.fillColor('#1a1a1a').text(
              formatCurrency(charge.amount, charge.currency),
              200,
              yPosition
            );
            doc.fillColor(charge.isPaid ? '#10b981' : '#ef4444').text(
              charge.isPaid ? 'Paid' : 'Unpaid',
              400,
              yPosition
            );
            yPosition += 20;
          });
          yPosition += 10;
        }

        // Modifications
        if (reservationDetails.modifications && reservationDetails.modifications.length > 0) {
          doc.fontSize(16).fillColor('#C5630C').text('Modification History', 50, yPosition);
          yPosition += 25;

          reservationDetails.modifications.forEach((mod) => {
            doc.fontSize(11).fillColor('#6b7280').text(formatDate(mod.createdAt), 50, yPosition);
            doc.fillColor('#1a1a1a').text(mod.description, 150, yPosition);
            yPosition += 18;
          });
          yPosition += 10;
        }

        // Footer
        const pageHeight = doc.page.height;
        doc
          .fontSize(10)
          .fillColor('#6b7280')
          .text(
            `Exported on ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}`,
            50,
            pageHeight - 50,
            { align: 'center' }
          );

        doc.end();
      } catch (error) {
        logger.error(`Error generating reservation PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        reject(error instanceof Error ? error : new Error('Unknown error generating PDF'));
      }
    });
  }
}

