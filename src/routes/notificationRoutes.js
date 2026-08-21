// src/routes/notificationRoutes.js - NEW FILE
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

// All routes are protected
router.use(protect);

// Get notifications
router.get('/', notificationController.getNotifications);

// Mark as read
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Settings
router.put('/settings', notificationController.updateSettings);

// Device token
router.post('/device-token', notificationController.registerDeviceToken);

module.exports = router;