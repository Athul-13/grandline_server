import { Quote } from '../entities/quote.entity';
import { QuoteItinerary } from '../entities/quote_itinerary.entity';
import { Driver } from '../entities/driver.entity';
import { User } from '../entities/user.entity';

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
 * PDF generation service interface
 * Handles generation of quotation PDFs
 */
export interface IPDFGenerationService {
  /**
   * Generates a PDF quotation document
   * @param data Quote data including quote, itinerary, driver, and user
   * @returns Buffer containing the PDF file
   */
  generateQuotePDF(data: IQuotePDFData): Promise<Buffer>;
}
