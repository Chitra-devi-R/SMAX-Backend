const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { adminOnly } = require('../middlewares/adminAuth');
const adminController = require('../controllers/adminController');

router.get('/dashboard', protect, adminOnly, adminController.getDashboard);
router.get('/ads/pending', protect, adminOnly, adminController.getPendingAds);
router.put('/ads/:id/approve', protect, adminOnly, adminController.approveAd);
router.put('/ads/:id/reject', protect, adminOnly, adminController.rejectAd);
router.get('/users', protect, adminOnly, adminController.getAllUsers);
router.put('/users/:id/toggle-status', protect, adminOnly, adminController.toggleUserStatus);
router.get('/reports', protect, adminOnly, adminController.getReports);

module.exports = router;