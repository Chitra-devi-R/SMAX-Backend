// src/config/cloudinary.js - FIXED
const cloudinary = require('cloudinary').v2;

console.log('🔧 Configuring Cloudinary...');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);

// Verify configuration
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Cloudinary credentials are missing!');
  console.error('Please check your .env file');
} else {
  console.log('✅ Cloudinary configuration loaded');
}

// Export the configured cloudinary instance
module.exports = cloudinary;