import { OTPEmailData } from '../../types/email.types';

/**
 * Renders HTML version of OTP verification email
 * Styled with GRANDLINE theme colors
 */
export function renderOTPHTML(data: OTPEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const expiryMinutes = data.expiryMinutes || 2;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - GRANDLINE</title>
</head>
<body style="font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #F4F1DE;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F1DE; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Email Verification</h1>
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
                Thank you for registering with GRANDLINE! Please use the following verification code to complete your registration:
              </p>
              
              <!-- OTP Code Box -->
              <div style="background-color: #F4F1DE; border: 2px solid #C5630C; border-radius: 8px; padding: 30px; margin: 30px 0; text-align: center;">
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 15px 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Your Verification Code</p>
                <h2 style="color: #C5630C; font-size: 42px; letter-spacing: 12px; margin: 0; font-family: 'Courier New', monospace; font-weight: 700;">
                  ${data.otp}
                </h2>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; text-align: center;">
                This code will expire in <strong style="color: #C5630C;">${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}</strong>.
              </p>
              
              <p style="font-size: 14px; color: #9ca3af; margin: 20px 0 0 0; text-align: center;">
                If you didn't request this code, please ignore this email.
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
 * Renders plain text version of OTP verification email
 */
export function renderOTPText(data: OTPEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const expiryMinutes = data.expiryMinutes || 2;

  return `
Email Verification - GRANDLINE

${greeting}

Thank you for registering with GRANDLINE! Please use the following verification code to complete your registration:

Your Verification Code: ${data.otp}

This code will expire in ${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}.

If you didn't request this code, please ignore this email.

This is an automated message from GRANDLINE. Please do not reply to this email.

© ${new Date().getFullYear()} GRANDLINE. All rights reserved.
  `.trim();
}
