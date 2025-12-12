import { Quote } from '../entities/quote.entity';
import { QuoteItinerary } from '../entities/quote_itinerary.entity';
import { Driver } from '../entities/driver.entity';
import { User } from '../entities/user.entity';
import { Reservation } from '../entities/reservation.entity';

/**
 * Data required for PDF generation
 */
export interface IQuotePDFData {
  quote: Quote;
  itinerary: QuoteItinerary[];
  driver?: Driver;
  user: User;
}

/**
 * Data required for invoice PDF generation
 */
export interface IInvoicePDFData {
  reservation: Reservation;
  user: User;
  invoiceNumber: string;
  paymentAmount: number;
  paymentDate: Date;
  paymentMethod: string;
}

/**
 * PDF generation service interface
 * Handles generation of quotation and invoice PDFs
 */
export interface IPDFGenerationService {
  /**
   * Generates a PDF quotation document
   * @param data Quote data including quote, itinerary, driver, and user
   * @returns Buffer containing the PDF file
   */
  generateQuotePDF(data: IQuotePDFData): Promise<Buffer>;

  /**
   * Generates a PDF invoice document
   * @param data Reservation data including reservation, user, payment details
   * @returns Buffer containing the PDF file
   */
  generateInvoicePDF(data: IInvoicePDFData): Promise<Buffer>;
}
