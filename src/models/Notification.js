// src/models/Notification.js - NEW FILE
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  type: {
    type: String,
    enum: [
      'new_message',
      'new_call',
      'missed_call',
      'ad_approved',
      'ad_rejected',
      'ad_sold',
      'price_drop',
      'new_ad_in_category',
      'account_verified',
      'system'
    ],
    required: true
  },
  
  title: {
    en: String,
    hi: String,
    ta: String,
    te: String
  },
  
  message: {
    en: String,
    hi: String,
    ta: String,
    te: String
  },
  
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  relatedAd: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    default: null
  },
  
  relatedChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    default: null
  },
  
  isRead: {
    type: Boolean,
    default: false
  },
  
  readAt: {
    type: Date,
    default: null
  },
  
  isSent: {
    type: Boolean,
    default: false
  },
  
  sentAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);