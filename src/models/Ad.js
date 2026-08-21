// src/models/Ad.js - UPDATED WITH VIDEO SUPPORT
const mongoose = require('mongoose');

const adSchema = new mongoose.Schema({
  // Basic Info
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  
  // Vehicle Details
  brand: {
    type: String,
    required: [true, 'Please provide vehicle brand']
  },
  model: {
    type: String,
    required: [true, 'Please provide vehicle model']
  },
  year: {
    type: Number,
    required: [true, 'Please provide manufacturing year'],
    min: [1900, 'Year must be after 1900'],
    max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
  },
  fuelType: {
    type: String,
    required: [true, 'Please select fuel type'],
    enum: ['petrol', 'diesel', 'electric', 'cng', 'hybrid']
  },
  transmission: {
    type: String,
    required: [true, 'Please select transmission type'],
    enum: ['manual', 'automatic']
  },
  kmDriven: {
    type: Number,
    required: [true, 'Please provide kilometers driven'],
    min: [0, 'Kilometers cannot be negative']
  },
  owners: {
    type: Number,
    required: [true, 'Please provide number of owners'],
    min: [1, 'Must have at least 1 owner'],
    max: [10, 'Cannot exceed 10 owners']
  },
  
  // Price
  price: {
    type: Number,
    required: [true, 'Please provide price'],
    min: [0, 'Price cannot be negative']
  },
  
  // Media - UPDATED TO SUPPORT VIDEO
  images: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    }
  }],
  
  // 🆕 NEW: Video Support
  video: {
    url: {
      type: String,
      default: null
    },
    publicId: {
      type: String,
      default: null
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    thumbnail: {
      type: String,
      default: null
    }
  },
  
  // Location
  location: {
    city: {
      type: String,
      required: [true, 'Please provide city']
    },
    state: {
      type: String,
      required: [true, 'Please provide state']
    },
    pincode: {
      type: String,
      required: [true, 'Please provide pincode']
    }
  },
  
  // Additional Details
  registrationNumber: {
    type: String,
    trim: true
  },
  insurance: {
    type: String,
    enum: ['valid', 'expired', 'none'],
    default: 'none'
  },
  color: {
    type: String,
    trim: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  
  // Seller Info
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sold'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // Timestamps
  approvedAt: {
    type: Date,
    default: null
  },
  soldAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
adSchema.index({ seller: 1, status: 1 });
adSchema.index({ category: 1, status: 1 });
adSchema.index({ status: 1, createdAt: -1 });
adSchema.index({ 'location.city': 1, 'location.state': 1 });
adSchema.index({ price: 1 });

module.exports = mongoose.model('Ad', adSchema);