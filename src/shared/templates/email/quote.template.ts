import { QuoteEmailData } from '../../types/email.types';

/**
 * Formats currency amount
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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
 * Renders HTML version of quote confirmation email
 * Styled with GRANDLINE theme colors
 */
export function renderQuoteHTML(data: QuoteEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const tripName = data.tripName || 'Your Trip';
  const tripTypeLabel = data.tripType === 'one_way' ? 'One Way' : 'Round Trip';
  const viewLink = data.viewQuoteLink || '#';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Confirmation - GRANDLINE</title>
</head>
<body style="font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #F4F1DE;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F1DE; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Quote Confirmation</h1>
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
                Thank you for choosing GRANDLINE! Your quote has been successfully submitted and is now under review. We'll get back to you shortly with the next steps.
              </p>
              
              <!-- Quote Details Card -->
              <div style="background-color: #F4F1DE; border: 2px solid #E8E5D0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #C5630C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Quote Details</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Quote ID:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.quoteId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Trip Name:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${tripName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Trip Type:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${tripTypeLabel}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Quote Date:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${formatDate(data.quoteDate)}</td>
                  </tr>
                </table>
              </div>
              
              <!-- Total Price Highlight -->
              <div style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); border-radius: 8px; padding: 25px; margin: 30px 0; text-align: center;">
                <p style="color: #FFFFFF; margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Total Price</p>
                <h2 style="color: #FFFFFF; margin: 0; font-size: 36px; font-weight: 700;">
                  ${formatCurrency(data.totalPrice)}
                </h2>
              </div>
              
              <!-- View Quote Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${viewLink}" 
                   style="display: inline-block; background-color: #C5630C; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  View Quote Details
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; line-height: 1.8;">
                Our team will review your quote and contact you soon. If you have any questions, please don't hesitate to reach out to us.
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
 * Renders plain text version of quote confirmation email
 */
export function renderQuoteText(data: QuoteEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const tripName = data.tripName || 'Your Trip';
  const tripTypeLabel = data.tripType === 'one_way' ? 'One Way' : 'Round Trip';

  return `
Quote Confirmation - GRANDLINE

${greeting}

Thank you for choosing GRANDLINE! Your quote has been successfully submitted and is now under review. We'll get back to you shortly with the next steps.

QUOTE DETAILS
-------------
Quote ID: ${data.quoteId}
Trip Name: ${tripName}
Trip Type: ${tripTypeLabel}
Quote Date: ${formatDate(data.quoteDate)}

Total Price: ${formatCurrency(data.totalPrice)}

${data.viewQuoteLink ? `View Quote: ${data.viewQuoteLink}` : ''}

Our team will review your quote and contact you soon. If you have any questions, please don't hesitate to reach out to us.

This is an automated message from GRANDLINE. Please do not reply to this email.

© ${new Date().getFullYear()} GRANDLINE. All rights reserved.
  `.trim();
}

