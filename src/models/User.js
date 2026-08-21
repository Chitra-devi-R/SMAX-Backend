// src/models/User.js - COMPLETE PRODUCTION VERSION
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    
    lowercase: true,
    trim: true
  },
  mobile: {
    type: String,
    required: [true, 'Please provide a mobile number'],
    
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  profilePhoto: {
    url: String,
    publicId: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    city: String,
    state: String,
    pincode: String
  },
  
savedAds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad'
  }],
  
  deviceTokens: {
    type: [String],
    default: []
  },
  



  // 🆕 OTP & Verification
  otp: {
    code: String,
    expiresAt: Date
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  // 🆕 Password Reset
  passwordResetOTP: {
    code: String,
    expiresAt: Date
  },
  passwordResetAttempts: {
    type: Number,
    default: 0
  },
  lastPasswordResetAt: Date,
  
  // 🆕 Device Tokens for Push Notifications
  deviceTokens: {
    type: [String],
    default: []
  },
  
  // Notification Settings
  notificationSettings: {
    pushEnabled: {
      type: Boolean,
      default: true
    },
    emailEnabled: {
      type: Boolean,
      default: true
    },
    smsEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  preferredLanguage: {
    type: String,
    enum: ['en', 'hi', 'ta', 'te'],
    default: 'en'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  lastLogin: Date,
  
  // Stats
  totalAds: {
    type: Number,
    default: 0
  },
  totalSales: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ mobile: 1 });
userSchema.index({ isActive: 1, isVerified: 1 });

// ✅ CORRECT - async function WITHOUT next
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if can reset password (rate limiting)
userSchema.methods.canResetPassword = function() {
  if (!this.lastPasswordResetAt) return true;
  
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  if (this.lastPasswordResetAt < oneHourAgo) {
    this.passwordResetAttempts = 0;
    return true;
  }
  
  return this.passwordResetAttempts < 3;
};

// Clear password reset data
userSchema.methods.clearPasswordResetData = function() {
  this.passwordResetOTP = undefined;
  this.passwordResetAttempts = 0;
  this.lastPasswordResetAt = new Date();
};

module.exports = mongoose.model('User', userSchema);