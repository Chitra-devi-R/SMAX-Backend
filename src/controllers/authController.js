// src/controllers/authController.js - COMPLETE FIXED VERSION
const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { verifyOTP } = require('../utils/otpService');
const { sendOTP } = require('../utils/smsService');
const { sendOTPEmail, sendWelcomeEmail } = require('../utils/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// ================================
// HELPER FUNCTION
// ================================

const generateOTPCode = () => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { code, expiresAt };
};

// ================================
// AUTH FUNCTIONS
// ================================

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    console.log('\n📝 REGISTRATION STARTED');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { name, email, mobile, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, mobile, password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or mobile already exists'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      mobile,
      password,
      role: role || 'buyer'
    });

    console.log('✅ User created:', user._id);

    // Generate OTP
    const { code, expiresAt } = generateOTPCode();
    user.otp = { code, expiresAt };
    await user.save();

    console.log('✅ OTP saved to database');

    // Send OTP
    try {
      await sendOTP(mobile, code);
      console.log('✅ SMS sent');
    } catch (error) {
      console.log('⚠️ SMS failed:', error.message);
    }

    try {
      await sendOTPEmail(email, code);
      console.log('✅ Email sent');
    } catch (error) {
      console.log('⚠️ Email failed:', error.message);
    }

    console.log('✅ REGISTRATION COMPLETED\n');

    res.status(201).json({
      success: true,
      message: 'Registration successful! OTP sent to your mobile and email.',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('❌ REGISTRATION FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
exports.verifyOTP = async (req, res) => {
  try {
    console.log('\n🔍 OTP VERIFICATION STARTED');
    const { emailOrMobile, otp } = req.body;

    if (!emailOrMobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide emailOrMobile and otp'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ User found:', user.email);

    // Verify OTP
    const verification = verifyOTP(user.otp, otp);

    if (!verification.valid) {
      return res.status(400).json({
        success: false,
        message: verification.message
      });
    }

    // Mark as verified
    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.name);
      console.log('✅ Welcome email sent');
    } catch (error) {
      console.log('⚠️ Welcome email failed:', error.message);
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ OTP VERIFICATION COMPLETED\n');

    res.json({
      success: true,
      message: 'OTP verified successfully. Welcome to SMAX!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profilePhoto: user.profilePhoto
      }
    });

  } catch (error) {
    console.error('❌ OTP VERIFICATION FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
exports.resendOTP = async (req, res) => {
  try {
    console.log('\n🔄 RESEND OTP STARTED');
    const { emailOrMobile } = req.body;

    if (!emailOrMobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or mobile number'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Account already verified. Please login.'
      });
    }

    // Generate new OTP
    const { code, expiresAt } = generateOTPCode();
    user.otp = { code, expiresAt };
    await user.save();

    console.log('✅ New OTP saved');

    // Send OTP
    try {
      await sendOTP(user.mobile, code);
      console.log('✅ SMS sent');
    } catch (error) {
      console.log('⚠️ SMS failed:', error.message);
    }

    try {
      await sendOTPEmail(user.email, code);
      console.log('✅ Email sent');
    } catch (error) {
      console.log('⚠️ Email failed:', error.message);
    }

    console.log('✅ RESEND OTP COMPLETED\n');

    res.json({
      success: true,
      message: 'OTP resent successfully',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('❌ RESEND OTP FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('\n🔐 LOGIN STARTED');
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    console.log('Login attempt:', emailOrMobile);

    // Find user
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile },
        { mobile: emailOrMobile }
      ]
    }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check verification
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your account first',
        requiresVerification: true
      });
    }

    // Check active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact support.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log('✅ LOGIN COMPLETED\n');

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        profilePhoto: user.profilePhoto,
        location: user.location
      }
    });

  } catch (error) {
    console.error('❌ LOGIN FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('\n👤 GET CURRENT USER:', req.user.id);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('❌ GET USER FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
      error: error.message
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res) => {
  try {
    console.log('\n🚪 LOGOUT:', req.user.id);

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ LOGOUT FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// @desc    Switch between buyer and seller role
// @route   PUT /api/users/switch-role
// @access  Private
exports.switchRole = async (req, res) => {
  try {
    console.log('\n🔄 SWITCH ROLE:', req.user.id);

    const { role } = req.body;

    if (!role || !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid role: buyer or seller'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from switching
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin cannot switch role'
      });
    }

    if (user.role === role) {
      return res.status(400).json({
        success: false,
        message: `You are already a ${role}`
      });
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    console.log(`✅ Role switched: ${oldRole} → ${role}\n`);

    res.json({
      success: true,
      message: `Role switched to ${role} successfully`,
      data: {
        previousRole: oldRole,
        currentRole: role,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('❌ SWITCH ROLE FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to switch role',
      error: error.message
    });
  }
};

// @desc    Update preferred language
// @route   PUT /api/auth/language
// @access  Private
exports.updateLanguage = async (req, res) => {
  try {
    console.log('\n🌐 UPDATE LANGUAGE:', req.user.id);

    const { language } = req.body;
    const supportedLanguages = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'mr'];

    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Please provide valid language. Supported: ${supportedLanguages.join(', ')}`
      });
    }

    await User.findByIdAndUpdate(
      req.user.id,
      { preferredLanguage: language },
      { new: true }
    );

    console.log('✅ Language updated:', language);

    res.json({
      success: true,
      message: 'Language preference updated successfully',
      data: { preferredLanguage: language }
    });

  } catch (error) {
    console.error('❌ UPDATE LANGUAGE FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update language',
      error: error.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    console.log('\n🔐 FORGOT PASSWORD REQUEST');

    const { emailOrMobile } = req.body;

    if (!emailOrMobile) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email or mobile number'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email or mobile'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Check rate limit
    if (!user.canResetPassword()) {
      return res.status(429).json({
        success: false,
        message: 'Too many reset attempts. Please try again after 1 hour.'
      });
    }

    // Generate OTP
    const { code, expiresAt } = generateOTPCode();
    user.passwordResetOTP = { code, expiresAt };
    user.passwordResetAttempts = (user.passwordResetAttempts || 0) + 1;
    user.lastPasswordResetAt = new Date();
    await user.save();

    console.log('✅ Reset OTP saved');

    // Send OTP
    try {
      await sendOTP(user.mobile, code);
      console.log('✅ SMS sent');
    } catch (error) {
      console.log('⚠️ SMS failed:', error.message);
    }

    try {
      await sendOTPEmail(user.email, code);
      console.log('✅ Email sent');
    } catch (error) {
      console.log('⚠️ Email failed:', error.message);
    }

    console.log('✅ FORGOT PASSWORD COMPLETED\n');

    res.json({
      success: true,
      message: 'Password reset OTP sent to your email and mobile',
      expiresIn: '10 minutes'
    });

  } catch (error) {
    console.error('❌ FORGOT PASSWORD FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// @desc    Verify reset OTP
// @route   POST /api/auth/verify-reset-otp
// @access  Public
exports.verifyResetOTP = async (req, res) => {
  try {
    console.log('\n🔐 VERIFY RESET OTP');

    const { emailOrMobile, otp } = req.body;

    if (!emailOrMobile || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Please provide emailOrMobile and OTP'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.passwordResetOTP || !user.passwordResetOTP.code) {
      return res.status(400).json({
        success: false,
        message: 'No password reset request found. Please request a new OTP.'
      });
    }

    // Check expiry
    if (new Date() > user.passwordResetOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // Verify OTP
    if (user.passwordResetOTP.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    console.log('✅ RESET OTP VERIFIED\n');

    res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken
    });

  } catch (error) {
    console.error('❌ VERIFY RESET OTP FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
      error: error.message
    });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    console.log('\n🔐 RESET PASSWORD');

    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reset token and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify reset token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
   // const salt = await bcrypt.genSalt(10);
    // user.password = await bcrypt.hash(newPassword, salt);
   user.password = newPassword; // let pre-save hook hash it

    // Clear reset data
    user.passwordResetOTP = undefined;
    user.passwordResetAttempts = 0;
    user.lastPasswordResetAt = new Date();

    await user.save();

    console.log('✅ PASSWORD RESET COMPLETED\n');

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('❌ RESET PASSWORD FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   POST /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    console.log('\n🔒 CHANGE PASSWORD:', req.user.id);

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
   // const salt = await bcrypt.genSalt(10);
   // user.password = await bcrypt.hash(newPassword, salt);
    user.password = newPassword; // model will hash
    await user.save();
    //await user.save();

    console.log('✅ PASSWORD CHANGED\n');

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('❌ CHANGE PASSWORD FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// @desc    Reactivate account
// @route   POST /api/auth/reactivate
// @access  Public
exports.reactivate = async (req, res) => {
  try {
    console.log('\n🔄 REACTIVATE ACCOUNT');

    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    // Find user
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    }).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Account is already active'
      });
    }

    // Reactivate
    user.isActive = true;
    await user.save();

    const token = generateToken(user._id);

    console.log('✅ ACCOUNT REACTIVATED\n');

    res.json({
      success: true,
      message: 'Account reactivated successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });

  } catch (error) {
    console.error('❌ REACTIVATE FAILED:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate account',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  register: exports.register,
  verifyOTP: exports.verifyOTP,
  resendOTP: exports.resendOTP,
  login: exports.login,
  getMe: exports.getMe,
  logout: exports.logout,
  switchRole: exports.switchRole,
  updateLanguage: exports.updateLanguage,
  changePassword: exports.changePassword,
  reactivate: exports.reactivate,
  forgotPassword: exports.forgotPassword,
  verifyResetOTP: exports.verifyResetOTP,
  resetPassword: exports.resetPassword
};