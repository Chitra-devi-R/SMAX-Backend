const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema({
  ad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ad',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: [true, 'Enquiry message is required'],
    trim: true,
    minlength: [10, 'Message must be at least 10 characters'],
    maxlength: [500, 'Message cannot exceed 500 characters']
  },
  buyerContact: {
    mobile: String,
    email: String
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'closed'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

enquirySchema.index({ seller: 1, createdAt: -1 });
enquirySchema.index({ buyer: 1, createdAt: -1 });

module.exports = mongoose.model('Enquiry', enquirySchema);