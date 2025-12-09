// Email service using SendGrid SDK (better for Vercel serverless)
import sgMail from '@sendgrid/mail';

// Initialize SendGrid
const initializeSendGrid = () => {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
  if (apiKey && apiKey !== 'your-sendgrid-api-key') {
    sgMail.setApiKey(apiKey);
  }
};

export const sendOTPEmail = async (email: string, code: string): Promise<void> => {
  initializeSendGrid();

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@prism-cards.com',
    replyTo: process.env.EMAIL_FROM || 'noreply@prism-cards.com',
    subject: 'Your Prism Portfolio Sign-In Code',
    categories: ['authentication', 'otp'],
    customArgs: {
      type: 'otp-authentication'
    },
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Prism Portfolio Sign-In Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 1px solid #333; border-radius: 16px; overflow: hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);">
                      <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">Prism Portfolio</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px; font-weight: bold;">Sign-In Verification</h2>
                      <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                        You requested to sign in to Prism Portfolio. Please use the verification code below to complete your sign-in. This code expires in 5 minutes.
                      </p>

                      <!-- OTP Code Display -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <div style="display: inline-block; padding: 24px 48px; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(163, 230, 53, 0.3);">
                              <span style="color: #000; font-size: 36px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                ${code}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        If you didn't request this code, you can safely ignore this email. The code will expire in 5 minutes.
                      </p>

                      <!-- Divider -->
                      <div style="margin: 30px 0; height: 1px; background: #333;"></div>

                      <!-- Security Notice -->
                      <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.6;">
                        <strong style="color: #f87171;">Security Notice:</strong> Never share this code with anyone. Prism Portfolio will never ask for your code via email or phone.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #333;">
                      <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                        © 2025 Prism Portfolio. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0; color: #475569; font-size: 11px; text-align: center;">
                        Track your cards like crypto assets
                      </p>
                      <p style="margin: 10px 0 0; color: #475569; font-size: 10px; text-align: center;">
                        This is a transactional email for account authentication.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Your Prism Portfolio Sign-In Code

Enter this code to sign in to your account:

${code}

This code will expire in 5 minutes.

If you didn't request this code, you can safely ignore this email.

Security Notice: Never share this code with anyone. Prism Portfolio will never ask for your code via email or phone.

© 2025 Prism Portfolio
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log('OTP email sent successfully to:', email);
  } catch (error: any) {
    console.error('Error sending OTP email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw new Error('Failed to send OTP email');
  }
};

export const sendCustomEmailLink = async (email: string, link: string): Promise<void> => {
  initializeSendGrid();

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM || 'noreply@prism-cards.com',
    subject: '🔐 Sign in to Prism Portfolio',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Sign in to Prism Portfolio</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); border: 1px solid #333; border-radius: 16px; overflow: hidden;">

                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%);">
                      <h1 style="margin: 0; color: #000; font-size: 28px; font-weight: bold;">Prism Portfolio</h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="margin: 0 0 20px; color: #fff; font-size: 24px; font-weight: bold;">Sign in to your account</h2>
                      <p style="margin: 0 0 30px; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                        Click the button below to securely sign in to your Prism Portfolio account. This link will expire in 60 minutes.
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 20px 0;">
                            <a href="${link}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #a3e635 0%, #84cc16 100%); color: #000; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 12px rgba(163, 230, 53, 0.3);">
                              Sign In to Prism
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                        If you didn't request this email, you can safely ignore it. This link will expire and cannot be used again.
                      </p>

                      <!-- Divider -->
                      <div style="margin: 30px 0; height: 1px; background: #333;"></div>

                      <!-- Alternative Link -->
                      <p style="margin: 0; color: #64748b; font-size: 12px; line-height: 1.6;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin: 10px 0 0; color: #a3e635; font-size: 12px; word-break: break-all;">
                        ${link}
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid #333;">
                      <p style="margin: 0; color: #64748b; font-size: 12px; text-align: center;">
                        © 2025 Prism Portfolio. All rights reserved.
                      </p>
                      <p style="margin: 10px 0 0; color: #475569; font-size: 11px; text-align: center;">
                        Track your cards like crypto assets
                      </p>
                      <p style="margin: 10px 0 0; color: #475569; font-size: 10px; text-align: center;">
                        This is a transactional email for account authentication.
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
    text: `
Sign in to Prism Portfolio

Click the link below to sign in to your account:
${link}

This link will expire in 60 minutes.

If you didn't request this email, you can safely ignore it.

© 2025 Prism Portfolio
    `.trim(),
  };

  try {
    await sgMail.send(msg);
    console.log('Custom email sent successfully to:', email);
  } catch (error: any) {
    console.error('Error sending custom email:', error);
    if (error.response) {
      console.error('SendGrid error response:', error.response.body);
    }
    throw new Error('Failed to send sign-in email');
  }
};
