// src/routes/adRoutes.js - FIXED ROUTE ORDER
const express = require('express');
const router = express.Router();
const adController = require('../controllers/adController');
const { protect } = require('../middlewares/auth');
const { uploadMedia } = require('../middlewares/upload');



// ✅ SPECIFIC ROUTES FIRST (before /:id)

// Search ads
router.get('/search', adController.searchAds);

// Get my ads (seller's own ads)
router.get('/my-ads', protect, adController.getMyAds);

// Get nearby ads
router.get('/nearby', adController.getNearbyAds);

// Get ads by category
router.get('/category/:categoryId', adController.getAdsByCategory);

// Get ads by user
router.get('/user/:userId', adController.getAdsByUser);

// Get all ads (public)
router.get('/', adController.getAllAds);

// ✅ PARAMETERIZED ROUTES (after specific routes)

// Get single ad by ID
router.get('/:id', adController.getAdById);

// Increment views
router.post('/:id/view', adController.incrementViews);

// Get enquiries for an ad
router.get('/:id/enquiries', protect, adController.getEnquiries);

// ✅ PROTECTED ROUTES (require authentication)

// Create new ad
router.post('/', protect, uploadMedia, adController.createAd);

// Update ad
router.put('/:id', protect, uploadMedia, adController.updateAd);

// Delete ad
router.delete('/:id', protect, adController.deleteAd);

// Mark ad as sold
router.put('/:id/sold', protect, adController.markAsSold);

// Send enquiry
router.post('/:id/enquiry', protect, adController.sendEnquiry);

module.exports = router;