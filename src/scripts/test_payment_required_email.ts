/**
 * Script to test payment required email
 * Sends a test email to preview how the payment required email looks
 * 
 * Usage: npm run test:payment-email
 */

import 'reflect-metadata';
import dotenv from 'dotenv';
import { registerAllDependencies } from '../infrastructure/di';
import { container } from '../infrastructure/di';
import { EmailType, PaymentRequiredEmailData } from '../shared/types/email.types';
import { SERVICE_TOKENS } from '../application/di/tokens';
import { IEmailService } from '../domain/services/email_service.interface';
import { logger } from '../shared/logger';
import { FRONTEND_CONFIG } from '../shared/config';

// Load environment variables
dotenv.config();

// Register all dependencies
registerAllDependencies();

async function testPaymentRequiredEmail() {
  try {
    console.log('🚀 Starting payment required email test...\n');

    // Get email service
    const emailService = container.resolve<IEmailService>(SERVICE_TOKENS.IEmailService);

    // Prepare test email data
    const emailData: PaymentRequiredEmailData = {
      email: 'one@mailinator.com',
      fullName: 'John Doe',
      reservationId: 'RES-2024-001234',
      chargeId: 'CHG-2024-001234',
      chargeDescription: 'Additional charge for vehicle upgrade',
      amount: 2500,
      currency: 'INR',
      chargeType: 'vehicle_upgrade',
      tripName: 'Weekend Getaway to Goa',
      tripType: 'two_way',
      paymentLink: `${FRONTEND_CONFIG.URL}/reservations/RES-2024-001234/charges/CHG-2024-001234/pay`,
      viewReservationLink: `${FRONTEND_CONFIG.URL}/reservations/RES-2024-001234`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    };

    console.log('📧 Sending payment required email...');
    console.log('   To:', emailData.email);
    console.log('   Reservation ID:', emailData.reservationId);
    console.log('   Charge ID:', emailData.chargeId);
    console.log('   Amount:', `${emailData.currency} ${emailData.amount}`);
    console.log('   Charge Type:', emailData.chargeType);
    console.log('');

    // Send email
    await emailService.sendEmail(EmailType.PAYMENT_REQUIRED, emailData);

    console.log('✅ Payment required email sent successfully!');
    console.log('');
    console.log('📬 Check your inbox at: https://www.mailinator.com/v4/public/inboxes.jsp?to=one');
    console.log('   (Email may take a few moments to arrive)');
    console.log('');

    // Test with different charge types
    const chargeTypes = ['additional_passenger', 'amenity_add', 'late_fee', 'other'];
    
    for (const chargeType of chargeTypes) {
      console.log(`📧 Sending payment required email for ${chargeType}...`);
      const testData: PaymentRequiredEmailData = {
        ...emailData,
        chargeId: `CHG-${chargeType}-${Date.now()}`,
        chargeType,
        chargeDescription: `Additional charge for ${chargeType.replace('_', ' ')}`,
      };
      
      await emailService.sendEmail(EmailType.PAYMENT_REQUIRED, testData);
      console.log(`✅ Email sent for ${chargeType}`);
    }

    console.log('');
    console.log('📬 Check your inbox at: https://www.mailinator.com/v4/public/inboxes.jsp?to=one');
    console.log('');

    process.exit(0);
  } catch (error) {
    logger.error('Failed to send test payment required email:', error);
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

// Run the test
void testPaymentRequiredEmail();

