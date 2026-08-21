const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    default: null
  },
  type: {
    type: String,
    enum: ['text', 'image', 'voice', 'video', 'file'], // 🆕 Added 'voice'
    default: 'text'
  },
  // 🆕 VOICE MESSAGE FIELD
  voiceMessage: {
    url: String,
    publicId: String,
    duration: Number,
    fileSize: Number
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model('Message', messageSchema);