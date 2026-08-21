// src/controllers/userController.js - UPLOAD PHOTO FUNCTION
const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary (if not already configured)
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

// @desc    Upload profile photo
// @route   POST /api/users/profile/photo
// @access  Private
exports.uploadPhoto = async (req, res) => {
  try {
    console.log('\n📸 UPLOAD PROFILE PHOTO');
    console.log('User ID:', req.user.id);
    console.log('File:', req.file ? req.file.originalname : 'No file');

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a photo'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old profile photo from Cloudinary if exists
    if (user.profilePhoto && user.profilePhoto.publicId) {
      console.log('🗑️ Deleting old profile photo...');
      await cloudinary.uploader.destroy(user.profilePhoto.publicId);
      console.log('✅ Old photo deleted');
    }

    // Upload new photo to Cloudinary
    console.log('📤 Uploading new photo to Cloudinary...');
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'smax/profiles',
      resource_type: 'image',
      transformation: [
        { width: 500, height: 500, crop: 'fill', gravity: 'face' },
        { quality: 'auto' },
        { fetch_format: 'auto' }
      ]
    });

    console.log('✅ Photo uploaded successfully');
    console.log('URL:', result.secure_url);

    // Update user profile
    user.profilePhoto = {
      url: result.secure_url,
      publicId: result.public_id
    };

    await user.save();

    console.log('✅ Profile updated\n');

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profilePhoto: user.profilePhoto.url
      }
    });

  } catch (error) {
    console.error('❌ Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo',
      error: error.message
    });
  }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, location } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (name) user.name = name;
    if (location) user.location = location;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// @desc    Get saved ads (wishlist)
// @route   GET /api/users/saved-ads
// @access  Private
exports.getSavedAds = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'savedAds',
        populate: {
          path: 'category seller',
          select: 'name profilePhoto'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      count: user.savedAds.length,
      data: user.savedAds
    });
  } catch (error) {
    console.error('Get saved ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get saved ads',
      error: error.message
    });
  }
};

// @desc    Save ad to wishlist
// @route   POST /api/users/saved-ads/:adId
// @access  Private
exports.saveAd = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const adId = req.params.adId;

    // Check if already saved
    if (user.savedAds.includes(adId)) {
      return res.status(400).json({
        success: false,
        message: 'Ad already in wishlist'
      });
    }

    user.savedAds.push(adId);
    await user.save();

    res.json({
      success: true,
      message: 'Ad saved to wishlist'
    });
  } catch (error) {
    console.error('Save ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save ad',
      error: error.message
    });
  }
};

// @desc    Remove ad from wishlist
// @route   DELETE /api/users/saved-ads/:adId
// @access  Private
exports.removeSavedAd = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const adId = req.params.adId;

    user.savedAds = user.savedAds.filter(
      id => id.toString() !== adId
    );

    await user.save();

    res.json({
      success: true,
      message: 'Ad removed from wishlist'
    });
  } catch (error) {
    console.error('Remove saved ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove ad',
      error: error.message
    });
  }
};

// Update Location with Coordinates
// @desc    Update user location with coordinates
// @route   PUT /api/users/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    console.log('\n📍 UPDATE LOCATION');
    console.log('User ID:', req.user.id);
    console.log('Body:', req.body);

    const { city, state, pincode, latitude, longitude, address } = req.body;

    if (!city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide city and state'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update location
    user.location = {
      city,
      state,
      pincode,
      address,
      coordinates: {
        type: 'Point',
        coordinates: [
          longitude || 0,
          latitude || 0
        ]
      }
    };

    await user.save();

    console.log('✅ Location updated');
    console.log('City:', city);
    console.log('Coordinates:', latitude, longitude);
    console.log('');

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.location
      }
    });

  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};// 🆕 NEW: Update Location with Coordinates
// @desc    Update user location with coordinates
// @route   PUT /api/users/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    console.log('\n📍 UPDATE LOCATION');
    console.log('User ID:', req.user.id);
    console.log('Body:', req.body);

    const { city, state, pincode, latitude, longitude, address } = req.body;

    if (!city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Please provide city and state'
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update location
    user.location = {
      city,
      state,
      pincode,
      address,
      coordinates: {
        type: 'Point',
        coordinates: [
          longitude || 0,
          latitude || 0
        ]
      }
    };

    await user.save();

    console.log('✅ Location updated');
    console.log('City:', city);
    console.log('Coordinates:', latitude, longitude);
    console.log('');

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.location
      }
    });

  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};
// src/controllers/userController.js - ADD THIS NEW FUNCTION

// ... (Keep all existing functions)

// 🆕 NEW: Update Location with Coordinates
// @desc    Update user location with coordinates
// @route   PUT /api/users/location
// @access  Private
exports.updateLocation = async (req, res) => {
  try {
    console.log('\n📍 UPDATE LOCATION');
    console.log('User ID:', req.user.id);
    console.log('Body:', req.body);

    const {city, state, pincode,latitude,longitude, address } = req.body;
     

    if (!city || !state) {
      return res.status(400).json({
       success: false,
       message: 'Please provide city and state'
     });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update location
    user.location = {
       type: 'Point',
  coordinates: [longitude, latitude],  // direct array
  address: address,
  city: city,
  state: state,
  pincode: pincode
      
    };

    await user.save();

    console.log('✅ Location updated');
    console.log('City:', city);
    console.log('Coordinates:', latitude, longitude);
    console.log('');

    res.json({
      success: true,
      message: 'Location updated successfully',
      data: {
        location: user.location
      }
    });

  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};


// ADD TO END OF userController.js

// @desc    Add device token for push notifications
// @route   POST /api/users/device-token
// @access  Private
exports.addDeviceToken = async (req, res) => {
  try {
    console.log('\n📱 ADD DEVICE TOKEN');
    console.log('User:', req.user.id);
    console.log('Token:', req.body.token);

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    const user = await User.findById(req.user.id);

    // Add token if not already exists
    if (!user.deviceTokens.includes(token)) {
      user.deviceTokens.push(token);
      await user.save();
      console.log('✅ Device token added');
    } else {
      console.log('⚠️  Token already exists');
    }

    res.json({
      success: true,
      message: 'Device token registered',
      tokenCount: user.deviceTokens.length
    });

  } catch (error) {
    console.error('❌ Add device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add device token'
    });
  }
};

// @desc    Remove device token
// @route   DELETE /api/users/device-token
// @access  Private
exports.removeDeviceToken = async (req, res) => {
  try {
    console.log('\n📱 REMOVE DEVICE TOKEN');
    
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Device token is required'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { deviceTokens: token } },
      { new: true }
    );

    console.log('✅ Device token removed');

    res.json({
      success: true,
      message: 'Device token removed',
      tokenCount: user.deviceTokens.length
    });

  } catch (error) {
    console.error('❌ Remove device token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove device token'
    });
  }
};
//user can swtch role

exports.switchRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!role || !['buyer', 'seller'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only "buyer" or "seller" allowed'
      });
    }

    const user = await User.findById(req.user.id);

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

    user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `Role switched from ${user.role} to ${role}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: role
      }
    });

  } catch (error) {
    console.error('❌ Switch role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to switch role'
    });
  }
};

module.exports = {
  uploadPhoto: exports.uploadPhoto,
  getProfile: exports.getProfile,
  updateProfile: exports.updateProfile,
  getSavedAds: exports.getSavedAds,
  saveAd: exports.saveAd,
  removeSavedAd: exports.removeSavedAd,
  updateLocation: exports.updateLocation,
  addDeviceToken: exports.addDeviceToken,
  removeDeviceToken: exports.removeDeviceToken,
  switchRole: exports.switchRole  // ADD THIS LINE
};

