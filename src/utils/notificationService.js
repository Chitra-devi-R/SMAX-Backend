// src/utils/notificationService.js - WITH FCM
const Notification = require('../models/Notification');
const User = require('../models/User');
const admin = require('firebase-admin');


// Initialize FCM
const path = require('path');
let fcmInitialized = false;

const initializeFCM = () => {
  const serviceAccountPath = path.resolve(
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH
);

  if (!serviceAccountPath || process.env.NODE_ENV === 'development') {
    console.log('⚠️  FCM not configured - Database notifications only');
    return false;
  }

  try {
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    
    console.log('✅ Firebase Cloud Messaging initialized');
    fcmInitialized = true;
    return true;
  } catch (error) {
    console.error('❌ FCM initialization error:', error.message);
    return false;
  }
};

initializeFCM();


// ==========================================
// NOTIFICATION SERVICE CLASS
// ==========================================

class NotificationService {
  /**
   * Create a notification for a user
   */
  async createNotification(recipientId, type, data = {}) {
    try {
      const notification = await Notification.create({
        recipient: recipientId,
        type: type,
        title: data.title || {},
        message: data.message || {},
        data: data.additionalData || {},
        relatedAd: data.adId || null,
        relatedChat: data.chatId || null
      });

      console.log(`✅ Notification created for user ${recipientId}`);
      
      // Send push notification
      await this.sendPushNotification(recipientId, notification);

      return notification;
    } catch (error) {
      console.error('❌ Create notification error:', error);
      return null;
    }
  }

  /**
   * Send push notification via FCM
   */
  async sendPushNotification(userId, notification) {
    try {
      const user = await User.findById(userId);
      
      if (!user || !user.notificationSettings.pushEnabled) {
        console.log('⚠️  User has push notifications disabled');
        return;
      }

      // Check if user has device tokens
      if (!user.deviceTokens || user.deviceTokens.length === 0) {
        console.log('⚠️  No device tokens found for user');
        return;
      }

      // Get user's preferred language
      const lang = user.preferredLanguage || 'en';
      const title = notification.title[lang] || notification.title.en;
      const message = notification.message[lang] || notification.message.en;

      // Development mode - just log
      if (!fcmInitialized) {
        console.log('📱 [DEV] Push notification would be sent:');
        console.log('   To:', user.name);
        console.log('   Tokens:', user.deviceTokens.length);
        console.log('   Title:', title);
        console.log('   Message:', message);
        return;
      }

      // Production mode - send via FCM
      console.log(`📱 Sending push to ${user.deviceTokens.length} device(s)...`);

      const messagePayload = {
        notification: {
          title: title,
          body: message
        },
        data: {
          type: notification.type,
          notificationId: notification._id.toString(),
          chatId: notification.relatedChat?.toString() || '',
          adId: notification.relatedAd?.toString() || '',
          clickAction: this.getClickAction(notification.type, notification)
        },
        tokens: user.deviceTokens
      };

      const response = await admin.messaging().sendMulticast(messagePayload);

      console.log('✅ Push sent successfully');
      console.log(`   Success: ${response.successCount}`);
      console.log(`   Failed: ${response.failureCount}`);

      // Remove invalid tokens
      if (response.failureCount > 0) {
        await this.removeInvalidTokens(userId, user.deviceTokens, response.responses);
      }

    } catch (error) {
      console.error('❌ Send push notification error:', error.message);
    }
  }

  /**
   * Get click action URL based on notification type
   */
  getClickAction(type, notification) {
    switch (type) {
      case 'new_message':
        return `/chat/${notification.relatedChat}`;
      case 'new_call':
        return `/call/${notification.relatedChat}`;
      case 'ad_approved':
      case 'ad_rejected':
        return `/ad/${notification.relatedAd}`;
      default:
        return '/notifications';
    }
  }

  /**
   * Remove invalid device tokens
   */
  async removeInvalidTokens(userId, tokens, responses) {
    try {
      const invalidTokens = [];
      
      responses.forEach((response, idx) => {
        if (!response.success) {
          const errorCode = response.error?.code;
          if (errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });

      if (invalidTokens.length > 0) {
        await User.findByIdAndUpdate(userId, {
          $pull: { deviceTokens: { $in: invalidTokens } }
        });
        console.log(`🗑️  Removed ${invalidTokens.length} invalid token(s)`);
      }
    } catch (error) {
      console.error('❌ Remove invalid tokens error:', error);
    }
  }

  /**
   * Notify user when ad is approved
   */
  async notifyAdApproved(userId, adId, adTitle) {
    return await this.createNotification(userId, 'ad_approved', {
      title: {
        en: 'Ad Approved!',
        hi: 'विज्ञापन स्वीकृत!',
        ta: 'விளம்பரம் அங்கீகரிக்கப்பட்டது!',
        te: 'ప్రకటన ఆమోదించబడింది!'
      },
      message: {
        en: `Your ad "${adTitle}" has been approved and is now live`,
        hi: `आपका विज्ञापन "${adTitle}" स्वीकृत हो गया है और अब सक्रिय है`,
        ta: `உங்கள் விளம்பரம் "${adTitle}" அங்கீகரிக்கப்பட்டு தற்போது செயல்பாட்டில் உள்ளது`,
        te: `మీ ప్రకటన "${adTitle}" ఆమోదించబడింది మరియు ఇప్పుడు ప్రత్యక్షంగా ఉంది`
      },
      adId: adId
    });
  }

  /**
   * Notify user when ad is rejected
   */
  async notifyAdRejected(userId, adId, adTitle, reason) {
    return await this.createNotification(userId, 'ad_rejected', {
      title: {
        en: 'Ad Rejected',
        hi: 'विज्ञापन अस्वीकृत',
        ta: 'விளம்பரம் நிராகரிக்கப்பட்டது',
        te: 'ప్రకటన తిరస్కరించబడింది'
      },
      message: {
        en: `Your ad "${adTitle}" was rejected. Reason: ${reason}`,
        hi: `आपका विज्ञापन "${adTitle}" अस्वीकार कर दिया गया। कारण: ${reason}`,
        ta: `உங்கள் விளம்பரம் "${adTitle}" நிராகரிக்கப்பட்டது. காரணம்: ${reason}`,
        te: `మీ ప్రకటన "${adTitle}" తిరస్కరించబడింది. కారణం: ${reason}`
      },
      adId: adId
    });
  }

  /**
   * Notify user about new message
   */
  async notifyNewMessage(userId, senderName, messagePreview, chatId) {
    return await this.createNotification(userId, 'new_message', {
      title: {
        en: 'New Message',
        hi: 'नया संदेश',
        ta: 'புதிய செய்தி',
        te: 'కొత్త సందేశం'
      },
      message: {
        en: `${senderName}: ${messagePreview}`,
        hi: `${senderName}: ${messagePreview}`,
        ta: `${senderName}: ${messagePreview}`,
        te: `${senderName}: ${messagePreview}`
      },
      chatId: chatId
    });
  }

  /**
   * Notify user about incoming call
   */
  async notifyIncomingCall(userId, callerName, chatId) {
    return await this.createNotification(userId, 'new_call', {
      title: {
        en: 'Incoming Call',
        hi: 'आने वाली कॉल',
        ta: 'உள்வரும் அழைப்பு',
        te: 'ఇన్‌కమింగ్ కాల్'
      },
      message: {
        en: `${callerName} is calling you`,
        hi: `${callerName} आपको कॉल कर रहे हैं`,
        ta: `${callerName} உங்களை அழைக்கிறார்`,
        te: `${callerName} మిమ్మల్ని కాల్ చేస్తున్నారు`
      },
      chatId: chatId
    });
  }
}

module.exports = new NotificationService();