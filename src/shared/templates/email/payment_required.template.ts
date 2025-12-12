import { PaymentRequiredEmailData } from '../../types/email.types';

/**
 * Formats currency amount
 */
function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

/**
 * Formats date
 */
function formatDate(date: Date | string | undefined): string {
  if (!date) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Renders HTML version of payment required email
 * Styled with GRANDLINE theme colors
 */
export function renderPaymentRequiredHTML(data: PaymentRequiredEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const tripName = data.tripName || 'Your Trip';
  const tripTypeLabel = data.tripType === 'one_way' ? 'One Way' : 'Round Trip';
  const viewLink = data.viewReservationLink || '#';
  const paymentLink = data.paymentLink || '#';
  const chargeTypeLabel = data.chargeType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Required - GRANDLINE</title>
</head>
<body style="font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #F4F1DE;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F1DE; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Payment Required</h1>
              <p style="color: #FFFFFF; margin: 10px 0 0 0; font-size: 16px; opacity: 0.95;">GRANDLINE</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 20px 0;">
                ${greeting}
              </p>
              
              <p style="font-size: 16px; color: #1a1a1a; margin: 0 0 30px 0; line-height: 1.8;">
                An additional charge has been added to your reservation. Please complete the payment to confirm your booking.
              </p>
              
              <!-- Charge Details Card -->
              <div style="background-color: #F4F1DE; border: 2px solid #E8E5D0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #C5630C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Charge Details</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Reservation ID:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.reservationId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Charge Type:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${chargeTypeLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Description:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.chargeDescription}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Due:</td>
                    <td style="padding: 8px 0; color: #C5630C; font-size: 18px; font-weight: 700;">${formatCurrency(data.amount, data.currency)}</td>
                  </tr>
                  ${data.dueDate ? `
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Due Date:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${formatDate(data.dueDate)}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <!-- Trip Details Card -->
              <div style="background-color: #F4F1DE; border: 2px solid #E8E5D0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #C5630C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Reservation Details</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Trip Name:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${tripName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Trip Type:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${tripTypeLabel}</td>
                  </tr>
                </table>
              </div>

              <!-- Payment Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); color: #FFFFFF; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(197, 99, 12, 0.3);">
                  Pay Now
                </a>
              </div>

              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; line-height: 1.8;">
                If you have any questions or concerns about this charge, please contact our support team. You can also 
                <a href="${viewLink}" style="color: #C5630C; text-decoration: none; font-weight: 600;">view your reservation</a> for more details.
              </p>

              <p style="font-size: 14px; color: #6b7280; margin: 20px 0 0 0;">
                Thank you for choosing GRANDLINE.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F4F1DE; padding: 30px; text-align: center; border-top: 1px solid #E8E5D0;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                This is an automated email. Please do not reply to this message.
              </p>
              <p style="font-size: 12px; color: #6b7280; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} GRANDLINE. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Renders plain text version of payment required email
 */
export function renderPaymentRequiredText(data: PaymentRequiredEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const tripName = data.tripName || 'Your Trip';
  const tripTypeLabel = data.tripType === 'one_way' ? 'One Way' : 'Round Trip';
  const chargeTypeLabel = data.chargeType.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());

  return `
PAYMENT REQUIRED - GRANDLINE

${greeting}

An additional charge has been added to your reservation. Please complete the payment to confirm your booking.

CHARGE DETAILS:
- Reservation ID: ${data.reservationId}
- Charge Type: ${chargeTypeLabel}
- Description: ${data.chargeDescription}
- Amount Due: ${formatCurrency(data.amount, data.currency)}
${data.dueDate ? `- Due Date: ${formatDate(data.dueDate)}` : ''}

RESERVATION DETAILS:
- Trip Name: ${tripName}
- Trip Type: ${tripTypeLabel}

${data.paymentLink ? `To complete your payment, please visit: ${data.paymentLink}` : 'Please contact our support team to complete your payment.'}

${data.viewReservationLink ? `View your reservation: ${data.viewReservationLink}` : ''}

If you have any questions or concerns about this charge, please contact our support team.

Thank you for choosing GRANDLINE.

---
This is an automated email. Please do not reply to this message.
© ${new Date().getFullYear()} GRANDLINE. All rights reserved.
  `.trim();
}

