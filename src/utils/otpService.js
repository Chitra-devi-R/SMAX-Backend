// src/utils/otpService.js - PRODUCTION-READY
const twilio = require('twilio');

// ==========================================
// TWILIO CLIENT CONFIGURATION
// ==========================================

const createTwilioClient = () => {
  const isTwilioConfigured = 
    process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE_NUMBER &&
    process.env.TWILIO_ACCOUNT_SID !== 'your-twilio-sid';

  if (!isTwilioConfigured) {
    console.log('⚠️  Twilio not configured - Using development mode');
    return null;
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    console.log('✅ Twilio client configured');
    return client;
  } catch (error) {
    console.error('❌ Twilio client error:', error.message);
    return null;
  }
};

const twilioClient = createTwilioClient();

// ==========================================
// GENERATE OTP
// ==========================================

exports.generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ADD THIS FUNCTION
exports.createOTP = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return {
    code,
    expiresAt
  };
};

// ==========================================
// SEND SMS
// ==========================================

exports.sendSMS = async (mobile, message) => {
  try {
    console.log('\n📱 ═══════════════════════════════════════════');
    console.log('📱 SENDING SMS');
    console.log('📱 ═══════════════════════════════════════════');
    console.log(`To: ${mobile}`);
    console.log(`Message: ${message}`);

    // Development mode - just log
    if (!twilioClient) {
      console.log('⚠️  TWILIO NOT CONFIGURED - DEVELOPMENT MODE');
      console.log('📱 SMS would be sent in production');
      console.log('📱 ═══════════════════════════════════════════\n');
      return {
        success: true,
        message: 'SMS logged to console (development mode)',
        mode: 'development'
      };
    }

    // Format phone number (add country code if missing)
    let formattedMobile = mobile;
    if (!mobile.startsWith('+')) {
      formattedMobile = `+91${mobile}`; // Default to India (+91)
    }

    // Production mode - send real SMS
    const result = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: formattedMobile
    });

    console.log('✅ SMS sent successfully');
    console.log('Message SID:', result.sid);
    console.log('Status:', result.status);
    console.log('📱 ═══════════════════════════════════════════\n');

    return {
      success: true,
      message: 'SMS sent successfully',
      sid: result.sid,
      status: result.status,
      mode: 'production'
    };

  } catch (error) {
    console.error('❌ SMS Error:', error.message);
    console.log('📱 ═══════════════════════════════════════════\n');
    
    // Fallback to console
    console.log('⚠️  SMS failed - Message logged to console');
    console.log('📱 Mobile:', mobile);
    console.log('📱 Message:', message);
    
    return {
      success: false,
      error: error.message,
      mode: 'fallback'
    };
  }
};

// ==========================================
// SEND OTP SMS
// ==========================================

exports.sendOTPSMS = async (mobile, otp) => {
  const message = `Your SMAX verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  return await exports.sendSMS(mobile, message);
};

// ==========================================
// SEND WELCOME SMS
// ==========================================

exports.sendWelcomeSMS = async (mobile, name) => {
  const message = `Welcome to SMAX, ${name}! Start buying and selling commercial vehicles today. Download the app: https://smax.app`;
  return await exports.sendSMS(mobile, message);
};
// ADD THIS TO otpService.js
exports.verifyOTP = (userOTP, enteredOTP) => {
  try {
    // Check if OTP exists
    if (!userOTP || !userOTP.code) {
      return {
        valid: false,
        message: 'No OTP found. Please request a new one.'
      };
    }

    // Check if OTP expired
    if (new Date() > new Date(userOTP.expiresAt)) {
      return {
        valid: false,
        message: 'OTP has expired. Please request a new one.'
      };
    }

    // Check if OTP matches
    if (userOTP.code !== enteredOTP) {
      return {
        valid: false,
        message: 'Invalid OTP. Please try again.'
      };
    }

    return {
      valid: true,
      message: 'OTP verified successfully'
    };

  } catch (error) {
    return {
      valid: false,
      message: 'OTP verification failed'
    };
  }
};
module.exports = {
  generateOTP: exports.generateOTP,
  createOTP: exports.createOTP,
  sendSMS: exports.sendSMS,
  sendOTPSMS: exports.sendOTPSMS,
  sendWelcomeSMS: exports.sendWelcomeSMS,
  verifyOTP: exports.verifyOTP  // ← ADD THIS
};