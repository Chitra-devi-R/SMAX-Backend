// src/models/Chat.js - UPDATED WITH CALL SUPPORT
const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  // Participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  
  // Related Ad
  ad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  },
  
  // Last Message Info
  lastMessage: {
    type: String,
    default: null
  },
  lastMessageTime: {
    type: Date,
    default: Date.now
  },
  lastMessageBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Unread Count for each participant
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // 🆕 NEW: Call History
  callHistory: [{
    callId: {
      type: String,
      required: true
    },
    caller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['initiated', 'ringing', 'answered', 'missed', 'rejected', 'ended'],
      default: 'initiated'
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      default: null
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    callType: {
      type: String,
      enum: ['audio', 'video'],
      default: 'audio'
    }
  }],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ ad: 1 });
chatSchema.index({ lastMessageTime: -1 });

module.exports = mongoose.model('Chat', chatSchema);
