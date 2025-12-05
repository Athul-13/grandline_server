import { injectable } from 'tsyringe';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit') as typeof import('pdfkit');
import { IPDFGenerationService, IQuotePDFData } from '../../domain/services/pdf_generation_service.interface';
import { TripType } from '../../shared/constants';
import { logger } from '../../shared/logger';

/**
 * PDF generation service implementation
 * Generates quotation PDFs using PDFKit
 */
@injectable()
export class PDFGenerationServiceImpl implements IPDFGenerationService {
  async generateQuotePDF(data: IQuotePDFData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', (buffer: Buffer) => buffers.push(buffer));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (error: Error) => reject(error));

        // Header
        doc
          .fontSize(24)
          .fillColor('#C5630C')
          .text('GRANDLINE', 50, 50, { align: 'center' });

        doc
          .fontSize(18)
          .fillColor('#1a1a1a')
          .text('Quotation', 50, 85, { align: 'center' });

        // Quote Details Section
        let yPosition = 130;

        doc.fontSize(14).fillColor('#6b7280').text('Quote ID:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(data.quote.quoteId, 150, yPosition);
        yPosition += 25;

        if (data.quote.tripName) {
          doc.fillColor('#6b7280').text('Trip Name:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(data.quote.tripName, 150, yPosition);
          yPosition += 25;
        }

        doc.fillColor('#6b7280').text('Trip Type:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(
          data.quote.tripType === TripType.ONE_WAY ? 'One Way' : 'Round Trip',
          150,
          yPosition
        );
        yPosition += 25;

        if (data.quote.passengerCount) {
          doc.fillColor('#6b7280').text('Passengers:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(data.quote.passengerCount.toString(), 150, yPosition);
          yPosition += 25;
        }

        // Customer Details
        yPosition += 10;
        doc.fontSize(16).fillColor('#C5630C').text('Customer Details', 50, yPosition);
        yPosition += 25;

        doc.fontSize(12).fillColor('#6b7280').text('Name:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(data.user.fullName, 150, yPosition);
        yPosition += 20;

        doc.fillColor('#6b7280').text('Email:', 50, yPosition);
        doc.fillColor('#1a1a1a').text(data.user.email, 150, yPosition);
        yPosition += 20;

        // Driver Details (if assigned)
        if (data.driver) {
          yPosition += 10;
          doc.fontSize(16).fillColor('#C5630C').text('Driver Details', 50, yPosition);
          yPosition += 25;

          doc.fontSize(12).fillColor('#6b7280').text('Name:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(data.driver.fullName, 150, yPosition);
          yPosition += 20;

          doc.fillColor('#6b7280').text('License Number:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(data.driver.licenseNumber, 150, yPosition);
          yPosition += 20;
        }

        // Itinerary Section
        if (data.itinerary && data.itinerary.length > 0) {
          yPosition += 10;
          doc.fontSize(16).fillColor('#C5630C').text('Itinerary', 50, yPosition);
          yPosition += 25;

          const outboundStops = data.itinerary
            .filter((stop) => stop.tripType === 'outbound')
            .sort((a, b) => a.stopOrder - b.stopOrder);

          if (outboundStops.length > 0) {
            doc.fontSize(14).fillColor('#1a1a1a').text('Outbound:', 50, yPosition);
            yPosition += 20;

            outboundStops.forEach((stop) => {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }

              const dateTime = new Date(stop.arrivalTime).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              doc.fontSize(11).fillColor('#1a1a1a').text(`• ${stop.locationName}`, 70, yPosition);
              doc.fillColor('#6b7280').fontSize(10).text(`  ${dateTime}`, 70, yPosition + 15);
              yPosition += 35;
            });
          }

          if (data.quote.tripType === TripType.TWO_WAY) {
            const returnStops = data.itinerary
              .filter((stop) => stop.tripType === 'return')
              .sort((a, b) => a.stopOrder - b.stopOrder);

            if (returnStops.length > 0) {
              yPosition += 10;
              doc.fontSize(14).fillColor('#1a1a1a').text('Return:', 50, yPosition);
              yPosition += 20;

              returnStops.forEach((stop) => {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }

                const dateTime = new Date(stop.arrivalTime).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                doc.fontSize(11).fillColor('#1a1a1a').text(`• ${stop.locationName}`, 70, yPosition);
                doc.fillColor('#6b7280').fontSize(10).text(`  ${dateTime}`, 70, yPosition + 15);
                yPosition += 35;
              });
            }
          }
        }

        // Pricing Section
        if (data.quote.pricing) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }

          yPosition += 20;
          doc.fontSize(16).fillColor('#C5630C').text('Pricing Breakdown', 50, yPosition);
          yPosition += 30;

          const pricing = data.quote.pricing;
          const formatCurrency = (amount: number) => {
            return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          };

          doc.fontSize(11);
          doc.fillColor('#6b7280').text('Base Fare:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(formatCurrency(pricing.baseFare ?? 0), 400, yPosition, { align: 'right' });
          yPosition += 20;

          doc.fillColor('#6b7280').text('Distance Fare:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(formatCurrency(pricing.distanceFare ?? 0), 400, yPosition, { align: 'right' });
          yPosition += 20;

          doc.fillColor('#6b7280').text('Driver Charge:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(formatCurrency(pricing.driverCharge ?? 0), 400, yPosition, { align: 'right' });
          yPosition += 20;

          if ((pricing.nightCharge ?? 0) > 0) {
            doc.fillColor('#6b7280').text('Night Charge:', 50, yPosition);
            doc.fillColor('#1a1a1a').text(formatCurrency(pricing.nightCharge ?? 0), 400, yPosition, { align: 'right' });
            yPosition += 20;
          }

          if ((pricing.amenitiesTotal ?? 0) > 0) {
            doc.fillColor('#6b7280').text('Amenities:', 50, yPosition);
            doc.fillColor('#1a1a1a').text(formatCurrency(pricing.amenitiesTotal ?? 0), 400, yPosition, { align: 'right' });
            yPosition += 20;
          }

          yPosition += 10;
          doc.moveTo(50, yPosition).lineTo(550, yPosition).strokeColor('#d1d5db').lineWidth(1).stroke();
          yPosition += 15;

          doc.fillColor('#6b7280').text('Subtotal:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(formatCurrency(pricing.subtotal ?? 0), 400, yPosition, { align: 'right' });
          yPosition += 20;

          doc.fillColor('#6b7280').text('Tax:', 50, yPosition);
          doc.fillColor('#1a1a1a').text(formatCurrency(pricing.tax ?? 0), 400, yPosition, { align: 'right' });
          yPosition += 20;

          yPosition += 10;
          doc.moveTo(50, yPosition).lineTo(550, yPosition).strokeColor('#C5630C').lineWidth(2).stroke();
          yPosition += 15;

          doc.fontSize(14).font('Helvetica-Bold');
          doc.fillColor('#C5630C').text('Total:', 50, yPosition);
          doc.fillColor('#C5630C').text(formatCurrency(pricing.total ?? 0), 400, yPosition, { align: 'right' });
        }

        // Footer
        const pageHeight = doc.page.height;
        doc
          .fontSize(10)
          .fillColor('#6b7280')
          .text(
            `Generated on ${new Date().toLocaleDateString('en-US', {
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
        logger.error(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
        reject(error);
      }
    });
  }
}
