// src/routes/userRoutes.js - WITH SWITCH ROLE
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/auth');
const multer = require('multer');

// ✅ Create dedicated multer instance for profile photo
const storage = multer.memoryStorage();
const uploadProfilePhoto = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed!'));
    }
  }
}).single('profilePhoto');

// All routes are protected
router.use(protect);

// Profile routes
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/profile/photo', uploadProfilePhoto, userController.uploadPhoto);
router.put('/location', userController.updateLocation);

// 🆕 Role Management - ADD THIS
router.put('/switch-role', userController.switchRole);

// Wishlist/Saved Ads routes
router.get('/saved-ads', userController.getSavedAds);
router.post('/saved-ads/:adId', userController.saveAd);
router.delete('/saved-ads/:adId', userController.removeSavedAd);

// Device token routes
router.post('/device-token', userController.addDeviceToken);
router.delete('/device-token', userController.removeDeviceToken);

module.exports = router;