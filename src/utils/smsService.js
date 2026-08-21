// src/utils/smsService.js
const sendOTP = async (mobile, otp) => {
  try {
    // Development mode - log to console
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 SMS Service (Development Mode)');
    console.log(`Mobile: ${mobile}`);
    console.log(`OTP: ${otp}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    return {
      success: true,
      message: 'OTP logged to console',
      mode: 'development'
    };
  } catch (error) {
    console.error('❌ SMS Error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = { sendOTP };