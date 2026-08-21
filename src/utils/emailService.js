// src/utils/emailService.js - PRODUCTION-READY EMAIL SERVICE
const nodemailer = require('nodemailer');

// ==========================================
// EMAIL TRANSPORTER CONFIGURATION
// ==========================================

// Create transporter based on environment
const createTransporter = () => {
  // Check if email is configured
  const isEmailConfigured = 
    process.env.EMAIL_USER && 
    process.env.EMAIL_PASSWORD && 
    process.env.EMAIL_USER !== 'your-email@gmail.com' &&
    process.env.EMAIL_PASSWORD !== 'YOUR_16_CHAR_APP_PASSWORD_HERE';

  if (!isEmailConfigured) {
    console.log('⚠️  Email not configured - Using development mode');
    return null;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Email transporter configured');
    return transporter;
  } catch (error) {
    console.error('❌ Email transporter error:', error.message);
    return null;
  }
};

const transporter = createTransporter();

// ==========================================
// EMAIL TEMPLATES
// ==========================================

const getOTPEmailTemplate = (otp, name = 'User') => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your OTP Code</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .content {
          padding: 40px 30px;
        }
        .otp-box {
          background-color: #f8f9fa;
          border: 2px dashed #667eea;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .otp-code {
          font-size: 36px;
          font-weight: bold;
          color: #667eea;
          letter-spacing: 8px;
          margin: 10px 0;
        }
        .info-text {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 SMAX Verification Code</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333;">Hello ${name},</p>
          <p class="info-text">
            You requested a verification code for your SMAX account. 
            Use the code below to complete your request:
          </p>
          
          <div class="otp-box">
            <p style="margin: 0; color: #666; font-size: 14px;">Your OTP Code</p>
            <div class="otp-code">${otp}</div>
            <p style="margin: 0; color: #666; font-size: 12px;">Valid for 10 minutes</p>
          </div>

          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <p style="margin: 5px 0 0 0; font-size: 13px;">
              Never share this code with anyone. SMAX will never ask for your OTP via phone or email.
            </p>
          </div>

          <p class="info-text">
            If you didn't request this code, please ignore this email or contact our support team.
          </p>
        </div>
        <div class="footer">
          <p>© 2026 SMAX App. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getWelcomeEmailTemplate = (name) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to SMAX</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 30px;
          text-align: center;
        }
        .content {
          padding: 40px 30px;
        }
        .feature-box {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
        }
        .feature-box h3 {
          color: #667eea;
          margin: 0 0 10px 0;
        }
        .button {
          display: inline-block;
          background-color: #667eea;
          color: white;
          padding: 12px 30px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome to SMAX!</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px;">Your marketplace for trucks and commercial vehicles</p>
        </div>
        <div class="content">
          <p style="font-size: 18px; color: #333;">Hello ${name},</p>
          <p style="color: #666; line-height: 1.6;">
            Thank you for joining SMAX! We're excited to have you as part of our community.
          </p>

          <div class="feature-box">
            <h3>🚛 Buy & Sell Vehicles</h3>
            <p style="margin: 0; color: #666;">Browse thousands of commercial vehicles or list your own.</p>
          </div>

          <div class="feature-box">
            <h3>💬 Direct Chat</h3>
            <p style="margin: 0; color: #666;">Connect with buyers and sellers instantly with our built-in messaging.</p>
          </div>

          <div class="feature-box">
            <h3>🔧 Find Services</h3>
            <p style="margin: 0; color: #666;">Locate nearby service centers and maintenance providers.</p>
          </div>

          <p style="color: #666; margin-top: 30px;">
            Ready to get started? Explore the marketplace and find your next vehicle!
          </p>
        </div>
        <div class="footer">
          <p>© 2026 SMAX App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const getApprovalEmailTemplate = (adTitle, status, note) => {
  const statusColor = status === 'approved' ? '#28a745' : '#dc3545';
  const statusIcon = status === 'approved' ? '✅' : '❌';
  const statusText = status === 'approved' ? 'Approved' : 'Rejected';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ad ${statusText}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
          background-color: ${statusColor};
          color: white;
          padding: 30px;
          text-align: center;
        }
        .content {
          padding: 40px 30px;
        }
        .status-box {
          background-color: #f8f9fa;
          border-left: 4px solid ${statusColor};
          padding: 20px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${statusIcon} Ad ${statusText}</h1>
        </div>
        <div class="content">
          <p style="font-size: 16px; color: #333;">Your ad has been reviewed</p>
          
          <div class="status-box">
            <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Ad Title:</p>
            <h2 style="margin: 0 0 15px 0; color: #333;">${adTitle}</h2>
            <p style="margin: 0 0 5px 0; color: #666; font-size: 14px;">Status:</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${statusColor};">${statusText}</p>
          </div>

          ${note ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0;">
            <strong>Note from Admin:</strong>
            <p style="margin: 10px 0 0 0;">${note}</p>
          </div>
          ` : ''}

          <p style="color: #666; margin-top: 20px;">
            ${status === 'approved' 
              ? 'Your ad is now live and visible to all users!' 
              : 'Please review the feedback and resubmit your ad if needed.'}
          </p>
        </div>
        <div class="footer">
          <p>© 2026 SMAX App. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// ==========================================
// EMAIL SENDING FUNCTIONS
// ==========================================

// Send OTP Email
const sendOTPEmail = async (email, otp, name = 'User') => {
  try {
    console.log('\n📧 ═══════════════════════════════════════════');
    console.log('📧 SENDING OTP EMAIL');
    console.log('📧 ═══════════════════════════════════════════');
    console.log(`To: ${email}`);
    console.log(`OTP: ${otp}`);
    console.log(`Name: ${name}`);

    // Development mode - just log
    if (!transporter) {
      console.log('⚠️  EMAIL NOT CONFIGURED - DEVELOPMENT MODE');
      console.log('🔑 OTP Code:', otp);
      console.log('📧 ═══════════════════════════════════════════\n');
      return {
        success: true,
        message: 'OTP logged to console (development mode)',
        mode: 'development',
        otp: otp // Return OTP for testing
      };
    }

    // Production mode - send real email
    const mailOptions = {
      from: `"SMAX App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your SMAX Verification Code: ${otp}`,
      html: getOTPEmailTemplate(otp, name)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Email sent successfully');
    console.log('Message ID:', info.messageId);
    console.log('📧 ═══════════════════════════════════════════\n');

    return {
      success: true,
      message: 'OTP email sent successfully',
      messageId: info.messageId,
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Email Error:', error.message);
    console.log('📧 ═══════════════════════════════════════════\n');
    
    // Fallback to console in case of error
    console.log('⚠️  Email failed - Showing OTP in console');
    console.log('🔑 OTP Code:', otp);
    
    return {
      success: false,
      error: error.message,
      mode: 'fallback',
      otp: otp // Return OTP even on error for testing
    };
  }
};

// Send Welcome Email
const sendWelcomeEmail = async (email, name) => {
  try {
    console.log(`\n📧 Sending welcome email to ${name} (${email})`);

    if (!transporter) {
      console.log('⚠️  Email not configured - skipping welcome email\n');
      return { success: true, mode: 'development' };
    }

    const mailOptions = {
      from: `"SMAX App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🎉 Welcome to SMAX - Your Marketplace Journey Begins!',
      html: getWelcomeEmailTemplate(name)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Welcome email sent successfully');
    console.log('Message ID:', info.messageId, '\n');

    return {
      success: true,
      message: 'Welcome email sent',
      messageId: info.messageId,
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Welcome email error:', error.message, '\n');
    return {
      success: false,
      error: error.message
    };
  }
};

// Send Approval Email
const sendApprovalEmail = async (email, adTitle, status, note = '') => {
  try {
    console.log(`\n📧 Sending ${status} email for ad: ${adTitle}`);

    if (!transporter) {
      console.log('⚠️  Email not configured - skipping approval email\n');
      return { success: true, mode: 'development' };
    }

    const mailOptions = {
      from: `"SMAX App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your SMAX Ad "${adTitle}" has been ${status}`,
      html: getApprovalEmailTemplate(adTitle, status, note)
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('✅ Approval email sent successfully');
    console.log('Message ID:', info.messageId, '\n');

    return {
      success: true,
      message: 'Approval email sent',
      messageId: info.messageId,
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ Approval email error:', error.message, '\n');
    return {
      success: false,
      error: error.message
    };
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendApprovalEmail
};