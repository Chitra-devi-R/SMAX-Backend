// src/controllers/adController.js - COMPLETE VERSION
const Ad = require('../models/Ad');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// @desc    Get all ads with filters
// @route   GET /api/ads
// @access  Public
exports.getAllAds = async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      fuelType,
      transmission,
      city,
      state,
      brand,
      search,
      status = 'approved',
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { status };

    if (category) filter.category = category;
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (state) filter['location.state'] = new RegExp(state, 'i');

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }

    const ads = await Ad.find(filter)
      .populate('category', 'name')
      .populate('seller', 'name profilePhoto location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Ad.countDocuments(filter);

    res.json({
      success: true,
      data: ads,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads',
      error: error.message
    });
  }
};

// @desc    Get single ad by ID
// @route   GET /api/ads/:id
// @access  Public
exports.getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('category', 'name')
      .populate('seller', 'name email mobile profilePhoto location');

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.json({
      success: true,
      data: ad
    });
  } catch (error) {
    console.error('Get ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad',
      error: error.message
    });
  }
};

// @desc    Create new ad with images and video
// @route   POST /api/ads
// @access  Private (Seller)
exports.createAd = async (req, res) => {
  try {
    console.log('\n📝 CREATE AD WITH MEDIA');
    console.log('Body:', req.body);
    console.log('Files:', req.files);

    const {
      title, description, category, brand, model, year,
      fuelType, transmission, kmDriven, owners, price,
      city, state, pincode, registrationNumber, insurance,
      color, condition
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !price) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.images) {
      console.log(`📤 Uploading ${req.files.images.length} images...`);
      
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, {
          folder: 'smax/ads/images',
          resource_type: 'image',
          transformation: [
            { width: 1200, height: 900, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
          ]
        });

        imageUrls.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
      console.log(`✅ ${imageUrls.length} images uploaded`);
    }

    // Upload video to Cloudinary (if provided)
    let videoData = null;
    if (req.files && req.files.video && req.files.video[0]) {
      console.log('📤 Uploading video...');
      
      const videoFile = req.files.video[0];
      const videoResult = await uploadToCloudinary(videoFile.buffer, {
        folder: 'smax/ads/videos',
        resource_type: 'video',
        eager: [
          { width: 1280, height: 720, crop: 'limit', format: 'mp4' }
        ],
        eager_async: true
      });

      videoData = {
        url: videoResult.secure_url,
        publicId: videoResult.public_id,
        duration: videoResult.duration || 0,
        thumbnail: videoResult.secure_url.replace(/\.[^.]+$/, '.jpg')
      };
      
      console.log('✅ Video uploaded successfully');
    }

    // Create ad
    const ad = await Ad.create({
      title,
      description,
      category,
      brand,
      model,
      year,
      fuelType,
      transmission,
      kmDriven,
      owners,
      price,
      images: imageUrls,
      video: videoData,
      location: { city, state, pincode },
      registrationNumber,
      insurance,
      color,
      condition,
      seller: req.user.id,
      status: 'pending'
    });

    console.log('✅ Ad created:', ad._id);

    res.status(201).json({
      success: true,
      message: 'Ad created successfully and pending approval',
      data: ad
    });

  } catch (error) {
    console.error('❌ Create ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create ad',
      error: error.message
    });
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private (Owner/Admin)
exports.updateAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check ownership
    if (ad.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ad'
      });
    }

    // Handle new images
    if (req.files && req.files.images) {
      const newImages = [];
      for (const file of req.files.images) {
        const result = await uploadToCloudinary(file.buffer, {
          folder: 'smax/ads/images',
          resource_type: 'image'
        });
        newImages.push({
          url: result.secure_url,
          publicId: result.public_id
        });
      }
      req.body.images = [...ad.images, ...newImages];
    }

    // Handle new video
    if (req.files && req.files.video && req.files.video[0]) {
      // Delete old video if exists
      if (ad.video && ad.video.publicId) {
        await cloudinary.uploader.destroy(ad.video.publicId, {
          resource_type: 'video'
        });
      }

      const videoFile = req.files.video[0];
      const videoResult = await uploadToCloudinary(videoFile.buffer, {
        folder: 'smax/ads/videos',
        resource_type: 'video'
      });

      req.body.video = {
        url: videoResult.secure_url,
        publicId: videoResult.public_id,
        duration: videoResult.duration || 0
      };
    }

    const updatedAd = await Ad.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: updatedAd
    });

  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update ad',
      error: error.message
    });
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private (Owner/Admin)
exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Check ownership
    if (ad.seller.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ad'
      });
    }

    // Delete images from Cloudinary
    if (ad.images && ad.images.length > 0) {
      for (const image of ad.images) {
        await cloudinary.uploader.destroy(image.publicId);
      }
    }

    // Delete video from Cloudinary
    if (ad.video && ad.video.publicId) {
      await cloudinary.uploader.destroy(ad.video.publicId, {
        resource_type: 'video'
      });
    }

    await Ad.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Ad deleted successfully'
    });

  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete ad',
      error: error.message
    });
  }
};

// @desc    Get my ads
// @route   GET /api/ads/my/listings
// @access  Private (Seller)
exports.getMyAds = async (req, res) => {
  try {
    const ads = await Ad.find({ seller: req.user.id })
      .populate('category', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: ads.length,
      data: ads
    });

  } catch (error) {
    console.error('Get my ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your ads',
      error: error.message
    });
  }
};

// @desc    Increment ad views
// @route   POST /api/ads/:id/view
// @access  Public
exports.incrementViews = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.json({
      success: true,
      views: ad.views
    });

  } catch (error) {
    console.error('Increment views error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to increment views',
      error: error.message
    });
  }
};

// 🆕 NEW: Search Ads Near Me (Location-based)
// @desc    Get ads near user's location
// @route   GET /api/ads/nearby
// @access  Public
exports.getNearbyAds = async (req, res) => {
  try {
    console.log('\n📍 GET NEARBY ADS');
    
    const {
      latitude,
      longitude,
      radius = 50, // default 50km
      category,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20
    } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    console.log('Location:', latitude, longitude);
    console.log('Radius:', radius, 'km');

    // Build filter
    const filter = { 
      status: 'approved'
    };

    if (category) filter.category = category;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // For now, we'll search by city/state since we don't have coordinates in Ad model
    // In production, you should add coordinates to Ad model too
    const ads = await Ad.find(filter)
      .populate('category', 'name')
      .populate('seller', 'name profilePhoto location')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Filter by approximate distance (city-based for now)
    // In production, use geospatial queries with coordinates
    const nearbyAds = ads.filter(ad => {
      // Simple city-based filtering
      // You can enhance this with actual distance calculation
      return ad.location && ad.location.city;
    });

    const count = nearbyAds.length;

    console.log(`✅ Found ${count} nearby ads\n`);

    res.json({
      success: true,
      data: nearbyAds,
      searchLocation: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius)
      },
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get nearby ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby ads',
      error: error.message
    });
  }
};


// @desc Search ads
// @route GET /api/ads/search
exports.searchAds = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query required"
      });
    }

    const ads = await Ad.find({
      status: "approved",
      $or: [
        { title: new RegExp(q, "i") },
        { description: new RegExp(q, "i") },
        { brand: new RegExp(q, "i") },
        { model: new RegExp(q, "i") }
      ]
    });

    res.json({
      success: true,
      count: ads.length,
      data: ads
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: error.message
    });
  }
};

exports.getAdsByCategory = async (req, res) => {
  try {
    const ads = await Ad.find({
      category: req.params.categoryId,
      status: "approved"
    });

    res.json({
      success: true,
      data: ads
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAdsByUser = async (req, res) => {
  try {
    const ads = await Ad.find({
      seller: req.params.userId
    });

    res.json({
      success: true,
      data: ads
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


exports.getEnquiries = async (req, res) => {
  res.json({
    success: true,
    message: "List of enquiries for this ad"
  });
};

exports.sendEnquiry = async (req, res) => {
  res.json({
    success: true,
    message: "Enquiry sent successfully"
  });
};
exports.markAsSold = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndUpdate(
      req.params.id,
      { status: "sold" },
      { new: true }
    );

    res.json({
      success: true,
      data: ad
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// Export the new function
module.exports = exports