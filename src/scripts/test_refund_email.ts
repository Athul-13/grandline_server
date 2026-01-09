/**
 * Script to test refund confirmation email
 * Sends a test email to preview how the refund confirmation email looks
 * 
 * Usage: npm run test:refund-email
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { registerAllDependencies } from '../infrastructure/di';
import { container } from '../infrastructure/di';
import { EmailType, RefundConfirmationEmailData } from '../shared/types/email.types';
import { SERVICE_TOKENS } from '../application/di/tokens';
import { IEmailService } from '../domain/services/email_service.interface';
import { logger } from '../shared/logger';
import { FRONTEND_CONFIG } from '../shared/config';

// Load environment variables
dotenv.config();

// Register all dependencies
registerAllDependencies();

async function testRefundEmail() {
  try {
    console.log('🚀 Starting refund email test...\n');

    // Get email service
    const emailService = container.resolve<IEmailService>(SERVICE_TOKENS.IEmailService);

    // Prepare test email data
    const emailData: RefundConfirmationEmailData = {
      email: 'one@mailinator.com',
      fullName: 'John Doe',
      reservationNumber: 'RES-2024-001234',
      refundAmount: 5000,
      refundId: 're_test_1234567890',
      refundDate: new Date(),
      currency: 'INR',
      tripName: 'Weekend Getaway to Goa',
      tripType: 'two_way',
      reason: 'Customer requested cancellation due to change in plans',
      isFullRefund: false,
      viewReservationLink: `${FRONTEND_CONFIG.URL}/reservations/RES-2024-001234`,
    };

    console.log('📧 Sending refund confirmation email...');
    console.log('   To:', emailData.email);
    console.log('   Refund Amount:', `${emailData.currency} ${emailData.refundAmount}`);
    console.log('   Refund Type:', emailData.isFullRefund ? 'Full Refund' : 'Partial Refund');
    console.log('');

    // Send email
    await emailService.sendEmail(EmailType.REFUND_CONFIRMATION, emailData);

    console.log('✅ Refund confirmation email sent successfully!');
    console.log('');
    console.log('📬 Check your inbox at: https://www.mailinator.com/v4/public/inboxes.jsp?to=one');
    console.log('   (Email may take a few moments to arrive)');
    console.log('');

    // Also test full refund
    console.log('📧 Sending full refund confirmation email...');
    const fullRefundData: RefundConfirmationEmailData = {
      ...emailData,
      refundAmount: 10000,
      isFullRefund: true,
      reason: 'Full refund processed',
    };

    await emailService.sendEmail(EmailType.REFUND_CONFIRMATION, fullRefundData);

    console.log('✅ Full refund confirmation email sent successfully!');
    console.log('');
    console.log('📬 Check your inbox at: https://www.mailinator.com/v4/public/inboxes.jsp?to=one');
    console.log('');

    process.exit(0);
  } catch (error) {
    logger.error('Failed to send test refund email:', error);
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

// Run the test
void testRefundEmail();
