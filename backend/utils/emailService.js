const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.auth
});

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetLink = `${config.frontendUrl}/reset-password?token=${token}`;

  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #4A90E2;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }
            .warning {
                background-color: #fff3cd;
                padding: 15px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Password Reset Request</h2>
            <p>Hi ${user.firstName},</p>
            <p>We received a request to reset your password for your PawWell Care Center account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4A90E2;">${resetLink}</p>
            <p><strong>Note:</strong> This link will expire in 1 hour.</p>
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you didn't request a password reset, please ignore this email and ensure your account is secure.</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
  `;

  const textMessage = `
Password Reset Request

Hi ${user.firstName},

We received a request to reset your password for your PawWell Care Center account.

Click this link to reset your password:
${resetLink}

Note: This link will expire in 1 hour.

⚠️ Security Notice:
If you didn't request a password reset, please ignore this email and ensure your account is secure.

© 2025 PawWell Care Center. All rights reserved.
  `;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: 'Password Reset - PawWell Care Center',
      text: textMessage,
      html: htmlMessage
    });
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

/**
 * Send password changed confirmation email
 */
const sendPasswordChangedEmail = async (user) => {
  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }
            .success {
                background-color: #d4edda;
                padding: 15px;
                border-left: 4px solid #28a745;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Password Changed Successfully</h2>
            <p>Hi ${user.firstName},</p>
            <div class="success">
                <p><strong>✅ Your password has been changed successfully!</strong></p>
            </div>
            <p>You can now log in to your PawWell Care Center account using your new password.</p>
            <p>If you didn't make this change, please contact our support team immediately.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
  `;

  const textMessage = `
Password Changed Successfully

Hi ${user.firstName},

✅ Your password has been changed successfully!

You can now log in to your PawWell Care Center account using your new password.

If you didn't make this change, please contact our support team immediately.

© 2025 PawWell Care Center. All rights reserved.
  `;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: 'Password Changed - PawWell Care Center',
      text: textMessage,
      html: htmlMessage
    });
    return true;
  } catch (error) {
    console.error('Error sending password changed email:', error);
    return false;
  }
};

/**
 * Send OTP email
 */
const sendOTPEmail = async (user, otp) => {
  const htmlMessage = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }
            .header {
                background-color: #4A90E2;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }
            .content {
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
            }
            .otp-box {
                background-color: #ffffff;
                border: 2px dashed #4A90E2;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
                border-radius: 8px;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #4A90E2;
                letter-spacing: 5px;
                font-family: 'Courier New', monospace;
            }
            .footer {
                text-align: center;
                padding: 20px;
                font-size: 12px;
                color: #666;
            }
            .warning {
                background-color: #fff3cd;
                padding: 15px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
            }
            .info {
                background-color: #d1ecf1;
                padding: 15px;
                border-left: 4px solid #17a2b8;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🐾 PawWell Care Center</h1>
        </div>
        <div class="content">
            <h2>Password Reset OTP</h2>
            <p>Hi ${user.firstName},</p>
            <p>We received a request to reset your password. Please use the following One-Time Password (OTP) to verify your identity:</p>
            
            <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">Enter this code to proceed with password reset</p>
            </div>
            
            <div class="info">
                <p><strong>ℹ️ Important Information:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>This OTP is valid for <strong>10 minutes</strong></li>
                    <li>You have <strong>5 attempts</strong> to enter the correct OTP</li>
                    <li>Do not share this code with anyone</li>
                </ul>
            </div>
            
            <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you didn't request a password reset, please ignore this email and ensure your account is secure. Your password will not be changed unless the OTP is verified.</p>
            </div>
        </div>
        <div class="footer">
            <p>&copy; 2025 PawWell Care Center. All rights reserved.</p>
            <p>Taking care of your pets, one paw at a time.</p>
        </div>
    </body>
    </html>
  `;

  const textMessage = `
Password Reset OTP

Hi ${user.firstName},

We received a request to reset your password. Please use the following One-Time Password (OTP) to verify your identity:

OTP: ${otp}

Important Information:
- This OTP is valid for 10 minutes
- You have 5 attempts to enter the correct OTP
- Do not share this code with anyone

⚠️ Security Notice:
If you didn't request a password reset, please ignore this email and ensure your account is secure.

© 2025 PawWell Care Center. All rights reserved.
  `;

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: user.email,
      subject: 'Password Reset OTP - PawWell Care Center',
      text: textMessage,
      html: htmlMessage
    });
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendOTPEmail
};
