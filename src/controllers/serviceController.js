// src/controllers/serviceController.js - WITHOUT AUTH REQUIREMENT
const Service = require('../models/Service');
const cloudinary = require('../config/cloudinary');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    console.log('\n🔧 GET ALL SERVICES');

    const {
      category,
      city,
      state,
      featured,
      page = 1,
      limit = 20
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (city) filter['serviceCenter.city'] = new RegExp(city, 'i');
    if (state) filter['serviceCenter.state'] = new RegExp(state, 'i');
    if (featured) filter.isFeatured = featured === 'true';

    console.log('📊 Filter:', filter);

    const services = await Service.find(filter)
      .populate('category', 'name icon')
      .populate('createdBy', 'name')
      .sort({ isFeatured: -1, rating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    console.log(`✅ Found ${services.length} services\n`);

    res.json({
      success: true,
      count: services.length,
      data: services,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get services error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get services',
      error: error.message
    });
  }
};

// Get nearby services
exports.getNearbyServices = async (req, res) => {
  try {
    console.log('\n📍 GET NEARBY SERVICES');

    const { latitude, longitude, radius = 50, category } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    const filter = {
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(longitude), Number(latitude)]
          },
          $maxDistance: radius * 1000
        }
      }
    };

    if (category) filter.category = category;

    const services = await Service.find(filter).populate('category', 'name icon').limit(50);

    console.log(`✅ Found ${services.length} nearby services\n`);

    res.json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('❌ Get nearby services error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get nearby services',
      error: error.message
    });
  }
};

// Get single service
exports.getService = async (req, res) => {
  try {
    console.log('\n🔍 GET SERVICE BY ID');
    console.log('Service ID:', req.params.id);

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    const service = await Service.findById(req.params.id)
      .populate('category', 'name icon description')
      .populate('createdBy', 'name email');

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    console.log('✅ Service found:', service.name);

    res.json({
      success: true,
      data: service
    });

  } catch (error) {
    console.error('❌ Get service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get service',
      error: error.message
    });
  }
};

// Create service
exports.createService = async (req, res) => {
  try {
    console.log('\n🔧 CREATE SERVICE');
    console.log('📥 Body:', req.body);

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please upload at least one image'
      });
    }

    console.log('📤 Uploading images...');

    const imageUploads = req.files.map(file => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'smax/services',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve({
              url: result.secure_url,
              publicId: result.public_id
            });
          }
        );
        uploadStream.end(file.buffer);
      });
    });

    const images = await Promise.all(imageUploads);
    console.log('✅ Images uploaded');

    const serviceData = {
      ...req.body,
      images,
      // FIX: Use req.user.id if available, otherwise use default admin ID
      createdBy: req.user ? req.user.id : '6978231caafc1275ceb5c028'
    };

    // Parse JSON strings
    if (typeof serviceData.serviceCenter === 'string') {
      serviceData.serviceCenter = JSON.parse(serviceData.serviceCenter);
    }
    if (typeof serviceData.pricing === 'string') {
      serviceData.pricing = JSON.parse(serviceData.pricing);
    }
    if (typeof serviceData.duration === 'string') {
      serviceData.duration = JSON.parse(serviceData.duration);
    }
    if (typeof serviceData.workingHours === 'string') {
      serviceData.workingHours = JSON.parse(serviceData.workingHours);
    }
    if (typeof serviceData.features === 'string') {
      serviceData.features = JSON.parse(serviceData.features);
    }
    if (typeof serviceData.contactNumbers === 'string') {
      serviceData.contactNumbers = JSON.parse(serviceData.contactNumbers);
    }

    // Validate contact numbers
    if (!serviceData.contactNumbers || serviceData.contactNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one contact number'
      });
    }

    // Validate phone numbers
    const phoneRegex = /^[0-9]{10,12}$/;
    for (let contact of serviceData.contactNumbers) {
      const cleanNumber = contact.number.replace(/\D/g, '');
      if (!phoneRegex.test(cleanNumber)) {
        return res.status(400).json({
          success: false,
          message: `Invalid phone number: ${contact.number}. Must be 10-12 digits.`
        });
      }
      contact.number = cleanNumber;
    }

    // Set location
    if (req.body.latitude && req.body.longitude) {
      serviceData.location = {
        type: 'Point',
        coordinates: [Number(req.body.longitude), Number(req.body.latitude)]
      };
    }

    console.log('💾 Creating service...');
    const service = await Service.create(serviceData);
    
    await service.populate('category', 'name icon');

    console.log('✅ Service created');
    console.log('📱 Contact numbers:', service.contactNumbers.length);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });

  } catch (error) {
    console.error('❌ Create service error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
      error: error.message
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  try {
    console.log('\n🔧 UPDATE SERVICE');
    console.log('Service ID:', req.params.id);

    let service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    if (req.files && req.files.length > 0) {
      console.log('📤 Uploading new images...');
      
      const imageUploads = req.files.map(file => {
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: 'smax/services' },
            (error, result) => {
              if (error) reject(error);
              else resolve({
                url: result.secure_url,
                publicId: result.public_id
              });
            }
          );
          uploadStream.end(file.buffer);
        });
      });

      const newImages = await Promise.all(imageUploads);
      req.body.images = [...service.images, ...newImages];
      
      console.log('✅ Images uploaded');
    }

    // Parse JSON strings
    if (typeof req.body.serviceCenter === 'string') {
      req.body.serviceCenter = JSON.parse(req.body.serviceCenter);
    }
    if (typeof req.body.pricing === 'string') {
      req.body.pricing = JSON.parse(req.body.pricing);
    }
    if (typeof req.body.contactNumbers === 'string') {
      req.body.contactNumbers = JSON.parse(req.body.contactNumbers);
    }

    // Validate phone numbers if updating
    if (req.body.contactNumbers) {
      const phoneRegex = /^[0-9]{10,12}$/;
      for (let contact of req.body.contactNumbers) {
        const cleanNumber = contact.number.replace(/\D/g, '');
        if (!phoneRegex.test(cleanNumber)) {
          return res.status(400).json({
            success: false,
            message: `Invalid phone number: ${contact.number}`
          });
        }
        contact.number = cleanNumber;
      }
    }

    service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('category', 'name icon');

    console.log('✅ Service updated\n');

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });

  } catch (error) {
    console.error('❌ Update service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
      error: error.message
    });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    console.log('\n🗑️ DELETE SERVICE');
    console.log('Service ID:', req.params.id);

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    console.log('🗑️ Deleting images from Cloudinary...');
    if (service.images && service.images.length > 0) {
      await Promise.all(
        service.images.map(img => cloudinary.uploader.destroy(img.publicId))
      );
    }

    await service.deleteOne();

    console.log('✅ Service deleted\n');

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
      error: error.message
    });
  }
};

// Search services
exports.searchServices = async (req, res) => {
  try {
    console.log('\n🔍 SEARCH SERVICES');
    console.log('Query params:', req.query);

    const { query, city, state } = req.query;

    const searchQuery = { isActive: true };

    if (query) {
      searchQuery.$or = [
        { name: new RegExp(query, 'i') },
        { description: new RegExp(query, 'i') },
        { 'serviceCenter.name': new RegExp(query, 'i') }
      ];
    }

    if (city) searchQuery['serviceCenter.city'] = new RegExp(city, 'i');
    if (state) searchQuery['serviceCenter.state'] = new RegExp(state, 'i');

    console.log('🔎 Search query:', JSON.stringify(searchQuery, null, 2));

    const services = await Service.find(searchQuery)
      .populate('category', 'name icon')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`✅ Found ${services.length} services\n`);

    res.json({
      success: true,
      count: services.length,
      data: services
    });

  } catch (error) {
    console.error('❌ Search services error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to search services',
      error: error.message
    });
  }
};

module.exports = {
  getAllServices: exports.getAllServices,
  getNearbyServices: exports.getNearbyServices,
  getService: exports.getService,
  createService: exports.createService,
  updateService: exports.updateService,
  deleteService: exports.deleteService,
  searchServices: exports.searchServices
};