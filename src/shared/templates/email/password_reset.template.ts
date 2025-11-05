import { PasswordResetEmailData } from '../../types/email.types';

/**
 * Renders HTML version of password reset email
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
  <title>Reset Your Password</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
    <h1 style="color: #2c3e50; margin-bottom: 20px;">Password Reset Request</h1>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      ${greeting}
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      We received a request to reset your password. Click the button below to create a new password:
    </p>
    
    <div style="margin: 30px 0;">
      <a href="${data.resetLink}" 
         style="display: inline-block; background-color: #3498db; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
        Reset Password
      </a>
    </div>
    
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    
    <p style="font-size: 12px; color: #3498db; word-break: break-all; margin: 10px 0 30px 0;">
      ${data.resetLink}
    </p>
    
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
      This link will expire in <strong>${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}</strong>.
    </p>
    
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 20px;">
      If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 40px 0;">
    
    <p style="font-size: 12px; color: #95a5a6; margin: 0;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
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
Password Reset Request

${greeting}

We received a request to reset your password. Click the link below to create a new password:

${data.resetLink}

This link will expire in ${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}.

If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

This is an automated message. Please do not reply to this email.
  `.trim();
}

