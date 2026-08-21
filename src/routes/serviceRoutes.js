const express = require('express');
const router = express.Router();
const multer = require('multer');
const serviceController = require('../controllers/serviceController');

// Configure multer for memory storage (same as upload middleware)
const upload = multer({ storage: multer.memoryStorage() });

// ⚠️ CRITICAL: Specific routes BEFORE parameterized /:id route

// Public routes - No authentication required
router.get('/search', serviceController.searchServices);        // Must be before /:id
router.get('/nearby', serviceController.getNearbyServices);     // Must be before /:id
router.get('/', serviceController.getAllServices);              // Get all services

// Admin routes - No authentication for now (can add later)
router.post('/', upload.array('images', 5), serviceController.createService);
router.put('/:id', upload.array('images', 5), serviceController.updateService);
router.delete('/:id', serviceController.deleteService);

// Public route - Get single service
router.get('/:id', serviceController.getService);               // MUST BE LAST

module.exports = router;