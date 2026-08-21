// src/config/agora.js - AGORA VOICE CALL CONFIGURATION
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

class AgoraService {
  constructor() {
    this.appId = process.env.AGORA_APP_ID || '';
    this.appCertificate = process.env.AGORA_APP_CERTIFICATE || '';
  }

  /**
   * Generate Agora RTC Token for voice/video calls
   * @param {string} channelName - Unique channel name (can be chatId)
   * @param {string} userId - User ID
   * @param {string} role - 'publisher' or 'subscriber'
   * @returns {object} Token and channel info
   */
  generateRTCToken(channelName, userId, role = 'publisher') {
    // Development mode - return dummy token if no credentials
    if (!this.appId || !this.appCertificate) {
      console.warn('⚠️  Agora credentials not configured. Using development mode.');
      return {
        token: 'DEVELOPMENT_MODE_TOKEN',
        appId: 'DEVELOPMENT_APP_ID',
        channelName: channelName,
        uid: userId,
        expiresIn: 3600,
        mode: 'development'
      };
    }

    try {
      const uid = userId;
      const privilegeExpireTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      const rtcRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

      const token = RtcTokenBuilder.buildTokenWithUid(
        this.appId,
        this.appCertificate,
        channelName,
        uid,
        rtcRole,
        privilegeExpireTime,
        currentTimestamp
      );

      return {
        token: token,
        appId: this.appId,
        channelName: channelName,
        uid: uid,
        expiresIn: 3600,
        mode: 'production'
      };
    } catch (error) {
      console.error('❌ Failed to generate Agora token:', error);
      throw new Error('Failed to generate call token');
    }
  }

  /**
   * Validate if Agora is configured
   */
  isConfigured() {
    return !!(this.appId && this.appCertificate);
  }
}

module.exports = new AgoraService();