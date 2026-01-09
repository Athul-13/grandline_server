import { QuoteEmailData } from '../../types/email.types';

/**
 * Formats currency amount
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
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
  const paymentLink = data.paymentLink || '#';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Quotation - GRANDLINE</title>
</head>
<body style="font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #F4F1DE;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F1DE; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Your Quotation</h1>
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
                Your quotation has been prepared with the assigned driver. Please find the detailed quotation attached as a PDF. You can review the pricing and proceed with payment when ready.
              </p>
              
              <!-- Quote Details Card -->
              <div style="background-color: #F4F1DE; border: 2px solid #E8E5D0; border-radius: 8px; padding: 25px; margin: 30px 0;">
                <h2 style="color: #C5630C; margin: 0 0 20px 0; font-size: 20px; font-weight: 600;">Quote Details</h2>
                
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 40%;">Quote Number:</td>
                    <td style="padding: 8px 0; color: #1a1a1a; font-size: 14px; font-weight: 600;">${data.quoteNumber}</td>
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
              
              <!-- Action Buttons -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${paymentLink}" 
                   style="display: inline-block; background-color: #C5630C; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 0 10px 10px 0;">
                  Pay Now
                </a>
                <a href="${viewLink}" 
                   style="display: inline-block; background-color: #FFFFFF; color: #C5630C; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; border: 2px solid #C5630C; margin: 0 10px 10px 0;">
                  View Quote Details
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; line-height: 1.8;">
                A detailed quotation PDF has been attached to this email. If you have any questions or would like to discuss the pricing, please feel free to contact us through the chat feature on your quote details page.
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
Your Quotation - GRANDLINE

${greeting}

Your quotation has been prepared with the assigned driver. Please find the detailed quotation attached as a PDF. You can review the pricing and proceed with payment when ready.

QUOTE DETAILS
-------------
Quote Number: ${data.quoteNumber}
Trip Name: ${tripName}
Trip Type: ${tripTypeLabel}
Quote Date: ${formatDate(data.quoteDate)}

Total Price: ${formatCurrency(data.totalPrice)}

${data.paymentLink ? `Pay Now: ${data.paymentLink}` : ''}
${data.viewQuoteLink ? `View Quote: ${data.viewQuoteLink}` : ''}

A detailed quotation PDF has been attached to this email. If you have any questions or would like to discuss the pricing, please feel free to contact us through the chat feature on your quote details page.

This is an automated message from GRANDLINE. Please do not reply to this email.

© ${new Date().getFullYear()} GRANDLINE. All rights reserved.
  `.trim();
}

