import { PasswordResetEmailData } from '../../types/email.types';

/**
 * Renders HTML version of password reset email
 * Styled with GRANDLINE theme colors
 */
export function renderPasswordResetHTML(data: PasswordResetEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const expiryMinutes = data.expiryMinutes || 5;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password - GRANDLINE</title>
</head>
<body style="font-family: 'Work Sans', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #1a1a1a; margin: 0; padding: 0; background-color: #F4F1DE;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F4F1DE; padding: 20px;">
    <tr>
      <td align="center">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #C5630C 0%, #b5590b 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 600;">Password Reset Request</h1>
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
                We received a request to reset your password. Click the button below to create a new password:
              </p>
              
              <!-- Reset Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="${data.resetLink}" 
                   style="display: inline-block; background-color: #C5630C; color: #FFFFFF; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; transition: background-color 0.3s;">
                  Reset Password
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 15px 0; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              
              <p style="font-size: 12px; color: #C5630C; word-break: break-all; margin: 0 0 30px 0; text-align: center; padding: 15px; background-color: #F4F1DE; border-radius: 6px;">
                ${data.resetLink}
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin: 30px 0 0 0; text-align: center;">
                This link will expire in <strong style="color: #C5630C;">${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}</strong>.
              </p>
              
              <p style="font-size: 14px; color: #9ca3af; margin: 20px 0 0 0; text-align: center;">
                If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
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
 * Renders plain text version of password reset email
 */
export function renderPasswordResetText(data: PasswordResetEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const expiryMinutes = data.expiryMinutes || 5;

  return `
Password Reset Request - GRANDLINE

${greeting}

We received a request to reset your password. Click the link below to create a new password:

${data.resetLink}

This link will expire in ${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

This is an automated message from GRANDLINE. Please do not reply to this email.

© ${new Date().getFullYear()} GRANDLINE. All rights reserved.
  `.trim();
}
