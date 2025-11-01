import { OTPEmailData } from '../../types/email.types';

/**
 * Renders HTML version of OTP verification email
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
  <title>Verify Your Email</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center;">
    <h1 style="color: #2c3e50; margin-bottom: 20px;">Email Verification</h1>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      ${greeting}
    </p>
    
    <p style="font-size: 16px; margin-bottom: 30px;">
      Thank you for registering with us! Please use the following verification code to complete your registration:
    </p>
    
    <div style="background-color: #ffffff; border: 2px dashed #3498db; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <h2 style="color: #3498db; font-size: 36px; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">
        ${data.otp}
      </h2>
    </div>
    
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 30px;">
      This code will expire in <strong>${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}</strong>.
    </p>
    
    <p style="font-size: 14px; color: #7f8c8d; margin-top: 20px;">
      If you didn't request this code, please ignore this email.
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
 * Renders plain text version of OTP verification email
 */
export function renderOTPText(data: OTPEmailData): string {
  const greeting = data.fullName ? `Hello ${data.fullName},` : 'Hello,';
  const expiryMinutes = data.expiryMinutes || 2;

  return `
Email Verification

${greeting}

Thank you for registering with us! Please use the following verification code to complete your registration:

Your Verification Code: ${data.otp}

This code will expire in ${expiryMinutes} minute${expiryMinutes > 1 ? 's' : ''}.

If you didn't request this code, please ignore this email.

This is an automated message. Please do not reply to this email.
  `.trim();
}

