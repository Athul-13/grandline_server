import { CancellationWithRefundEmailData } from '../../types/email.types';

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
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Renders HTML version of cancellation with refund email
 * Styled with GRANDLINE theme colors
 */
export function renderCancellationWithRefundHTML(data: CancellationWithRefundEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const tripName = data.tripName || 'Your Trip';
  const tripTypeLabel = data.tripType === 'one_way' ? 'One Way' : 'Round Trip';
  const viewLink = data.viewReservationLink || '#';
  const refundType = data.isFullRefund ? 'Full Refund' : 'Partial Refund';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reservation Cancelled - GRANDLINE</title>
</head>
<body style="font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #F4F1DE;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F1DE; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Reservation Cancelled</h1>
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
                Your reservation has been cancelled and ${formatCurrency(data.refundAmount, data.currency)} has been refunded. The refunded amount will be credited back to your original payment method within 5-10 business days.
              </p>
              
              <!-- Cancellation Details Card -->
              <div style="background-color: #F4F1DE; border: 2px solid #E8E5D0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #C5630C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Cancellation Details</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Reservation Number:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.reservationNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cancellation Reason:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.cancellationReason}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Cancelled At:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${formatDate(data.cancelledAt)}</td>
                  </tr>
                </table>
              </div>

              <!-- Refund Details Card -->
              <div style="background-color: #F4F1DE; border: 2px solid #E8E5D0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #C5630C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Refund Details</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Refund ID:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.refundId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Refund Type:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${refundType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Refund Date:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${formatDate(data.refundDate)}</td>
                  </tr>
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
              
              <!-- Refund Amount Highlight -->
              <div style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                <p style="color: #FFFFFF; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Refund Amount</p>
                <h2 style="color: #FFFFFF; margin: 0; font-size: 36px; font-weight: 700;">
                  ${formatCurrency(data.refundAmount, data.currency)}
                </h2>
              </div>
              
              <!-- Action Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${viewLink}" 
                   style="display: inline-block; background-color: #C5630C; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Reservation Details
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; line-height: 1.8;">
                The refund will be processed to your original payment method. If you have any questions or need assistance, please feel free to contact us through the chat feature on your reservation details page.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #E8E5D0; padding: 30px; text-align: center; border-top: 1px solid #d1d5db;">
              <p style="font-size: 12px; color: #6b7280; margin: 0;">
                This is an automated message from GRANDLINE. Please do not reply to this email.
              </p>
              <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0 0;">
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
  `.trim();
}

/**
 * Renders plain text version of cancellation with refund email
 */
export function renderCancellationWithRefundText(data: CancellationWithRefundEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const tripName = data.tripName || 'Your Trip';
  const tripTypeLabel = data.tripType === 'one_way' ? 'One Way' : 'Round Trip';
  const refundType = data.isFullRefund ? 'Full Refund' : 'Partial Refund';

  return `
Reservation Cancelled - GRANDLINE

${greeting}

Your reservation has been cancelled and ${formatCurrency(data.refundAmount, data.currency)} has been refunded. The refunded amount will be credited back to your original payment method within 5-10 business days.

CANCELLATION DETAILS
--------------------
Reservation Number: ${data.reservationNumber}
Cancellation Reason: ${data.cancellationReason}
Cancelled At: ${formatDate(data.cancelledAt)}

REFUND DETAILS
--------------
Refund ID: ${data.refundId}
Refund Type: ${refundType}
Refund Date: ${formatDate(data.refundDate)}

RESERVATION DETAILS
-------------------
Trip Name: ${tripName}
Trip Type: ${tripTypeLabel}

Refund Amount: ${formatCurrency(data.refundAmount, data.currency)}

${data.viewReservationLink ? `View Reservation: ${data.viewReservationLink}` : ''}

The refund will be processed to your original payment method. If you have any questions or need assistance, please feel free to contact us through the chat feature on your reservation details page.

This is an automated message from GRANDLINE. Please do not reply to this email.

© ${new Date().getFullYear()} GRANDLINE. All rights reserved.
  `.trim();
}

