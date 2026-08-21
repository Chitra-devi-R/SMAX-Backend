const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide service name'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  description: {
    type: String,
    required: [true, 'Please provide description'],
    trim: true
  },
  serviceCenter: {
    name: {
      type: String,
      required: [true, 'Please provide service center name']
    },
    city: {
      type: String,
      required: [true, 'Please provide city']
    },
    state: {
      type: String,
      required: [true, 'Please provide state']
    },
    address: {
      type: String,
      default: ''
    },
    pincode: {
      type: String,
      default: ''
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
      index: '2dsphere'
    }
  },
  contactNumbers: [{
    type: {
      type: String,
      enum: ['primary', 'support', 'emergency', 'other'],
      default: 'primary'
    },
    number: {
      type: String,
      required: true,
      trim: true
    },
    label: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  website: {
    type: String,
    trim: true
  },
  pricing: {
    type: Map,
    of: Number,
    default: {}
  },
  duration: {
    type: Map,
    of: String,
    default: {}
  },
  workingHours: {
    type: Map,
    of: String,
    default: {}
  },
  features: [{
    type: String,
    trim: true
  }],
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
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
serviceSchema.index({ location: '2dsphere' });

// Index for text search
serviceSchema.index({
  name: 'text',
  description: 'text',
  'serviceCenter.name': 'text'
});

// FIXED: Pre-save hook - removed next() call for async function
serviceSchema.pre('save', async function() {
  // Ensure at least one contact number is marked as primary
  if (this.contactNumbers && this.contactNumbers.length > 0) {
    const hasPrimary = this.contactNumbers.some(contact => contact.isPrimary);
    if (!hasPrimary) {
      this.contactNumbers[0].isPrimary = true;
    }
  }
  
  // Note: No next() call here because this is an async function
});

// FIXED: Pre-save hook for validation - removed next() call
serviceSchema.pre('save', async function() {
  // Validate at least one contact number exists
  if (!this.contactNumbers || this.contactNumbers.length === 0) {
    throw new Error('At least one contact number is required');
  }
  
  // Validate at least one image exists
  if (!this.images || this.images.length === 0) {
    throw new Error('At least one image is required');
  }
  
  // Note: No next() call here because this is an async function
});

// Virtual for getting primary contact
serviceSchema.virtual('primaryContact').get(function() {
  if (!this.contactNumbers || this.contactNumbers.length === 0) return null;
  return this.contactNumbers.find(c => c.isPrimary) || this.contactNumbers[0];
});

// Static method to get nearby services
serviceSchema.statics.findNearby = function(longitude, latitude, radius = 50) {
  return this.find({
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    }
  });
};

// Instance method to update rating
serviceSchema.methods.updateRating = async function(newRating) {
  this.reviewCount += 1;
  this.rating = ((this.rating * (this.reviewCount - 1)) + newRating) / this.reviewCount;
  await this.save();
};

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service;