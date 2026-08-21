// src/controllers/notificationController.js - NEW FILE
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    console.log('\n🔔 GET NOTIFICATIONS - User:', req.user.id);

    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    const filter = { recipient: req.user.id };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .populate('relatedAd', 'title images price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    // Get notification in user's preferred language
    const user = await User.findById(req.user.id);
    const lang = user.preferredLanguage || 'en';

    const formattedNotifications = notifications.map(notif => ({
      ...notif.toObject(),
      title: notif.title[lang] || notif.title.en,
      message: notif.message[lang] || notif.message.en
    }));

    console.log(`✅ Found ${notifications.length} notifications\n`);

    res.json({
      success: true,
      data: formattedNotifications,
      unreadCount,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('❌ Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get notifications',
      error: error.message
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    console.log('\n✅ MARK NOTIFICATION AS READ:', req.params.id);

    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      console.log('❌ Notification not found\n');
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    console.log('✅ Notification marked as read\n');

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    console.log('\n✅ MARK ALL AS READ - User:', req.user.id);

    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    console.log('✅ All notifications marked as read\n');

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('❌ Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all as read',
      error: error.message
    });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    console.log('\n🗑️ DELETE NOTIFICATION:', req.params.id);

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      console.log('❌ Notification not found\n');
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    console.log('✅ Notification deleted\n');

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// @desc    Update notification settings
// @route   PUT /api/notifications/settings
// @access  Private
exports.updateSettings = async (req, res) => {
  try {
    console.log('\n⚙️ UPDATE NOTIFICATION SETTINGS');
    console.log('User:', req.user.id);

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update notification settings
    user.notificationSettings = {
      ...user.notificationSettings,
      ...req.body
    };

    await user.save();

    console.log('✅ Notification settings updated\n');

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: user.notificationSettings
    });

  } catch (error) {
    console.error('❌ Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
};

// @desc    Register device token for push notifications
// @route   POST /api/notifications/device-token
// @access  Private
exports.registerDeviceToken = async (req, res) => {
  try {
    console.log('\n📱 REGISTER DEVICE TOKEN');

    const { token, platform } = req.body;

    if (!token || !platform) {
      return res.status(400).json({
        success: false,
        message: 'Please provide token and platform'
      });
    }

    const user = await User.findById(req.user.id);

    // Check if token already exists
    const existingToken = user.deviceTokens.find(dt => dt.token === token);

    if (!existingToken) {
      user.deviceTokens.push({
        token,
        platform,
        addedAt: new Date()
      });
      await user.save();
      console.log('✅ Device token registered\n');
    } else {
      console.log('⚠️ Device token already exists\n');
    }

    res.json({
      success: true,
      message: 'Device token registered successfully'
    });

  } catch (error) {
    console.error('❌ Register token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register device token',
      error: error.message
    });
  }
};

module.exports = exports;