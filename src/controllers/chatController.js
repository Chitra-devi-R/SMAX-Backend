// src/controllers/chatController.js - COMPLETE WITH VOICE MESSAGE SUPPORT
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');
const Ad = require('../models/Ad');
const Notification = require('../models/Notification');
const notificationService = require('../utils/notificationService');
const cloudinary = require('../config/cloudinary');

// @desc    Get all chats for current user
// @route   GET /api/chat
// @access  Private
exports.getAllChats = async (req, res) => {
  try {
    console.log('\n💬 GET ALL CHATS - User:', req.user.id);

    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate('participants', 'name profilePhoto')
    .populate('ad', 'title images price')
    .populate('lastMessageBy', 'name')
    .sort({ lastMessageTime: -1 });

    console.log(`✅ Found ${chats.length} chats\n`);

    res.json({
      success: true,
      count: chats.length,
      data: chats
    });

  } catch (error) {
    console.error('❌ Get chats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: error.message
    });
  }
};

// @desc    Start or get existing chat
// @route   POST /api/chat
// @access  Private
exports.startChat = async (req, res) => {
  try {
    console.log('\n💬 START/GET CHAT');
    console.log('Buyer:', req.user.id);
    console.log('Request body:', req.body);

    // ✅ NEW (accepts both names):
const { adId, sellerId, participantId } = req.body;
const otherParticipantId = sellerId || participantId;
    const buyerId = req.user.id;

   // ✅ NEW:
if (!adId || !otherParticipantId) {
  console.log('❌ Missing required fields\n');
  return res.status(400).json({
    success: false,
    message: 'Please provide adId and participantId'
  });
}

    // Check if ad exists
    const ad = await Ad.findById(adId);
    if (!ad) {
      console.log('❌ Ad not found\n');
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    console.log('✅ Ad found:', ad.title);

    // Check if chat already exists between these participants for this ad
    let chat = await Chat.findOne({
      participants: { $all: [buyerId, otherParticipantId]  },
      ad: adId
    })
    .populate('participants', 'name profilePhoto')
    .populate('ad', 'title images price');

    if (chat) {
      console.log('✅ Existing chat found:', chat._id);
      console.log('');
      return res.json({
        success: true,
        message: 'Chat retrieved successfully',
        data: chat
      });
    }

    // Create new chat
    console.log('📝 Creating new chat...');
    chat = await Chat.create({
      participants: [buyerId, otherParticipantId],
      ad: adId,
      unreadCount: {
        [buyerId]: 0,
        [otherParticipantId]: 0
      }
    });

    // Populate the created chat
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name profilePhoto')
      .populate('ad', 'title images price');

    console.log('✅ New chat created:', chat._id);
    console.log('');

    res.status(201).json({
      success: true,
      message: 'Chat started successfully',
      data: chat
    });

  } catch (error) {
    console.error('❌ Start chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start chat',
      error: error.message
    });
  }
};

// @desc    Get messages for a chat
// @route   GET /api/chat/:chatId/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    console.log('\n💬 GET MESSAGES - Chat:', req.params.chatId);

    const { chatId } = req.params;

    // Verify user is part of this chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('❌ Chat not found\n');
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(req.user.id)) {
      console.log('❌ User not part of this chat\n');
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    // Get messages
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name profilePhoto')
      .sort({ createdAt: 1 });

    console.log(`✅ Found ${messages.length} messages\n`);

    res.json({
      success: true,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('❌ Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get messages',
      error: error.message
    });
  }
};

// @desc    Send message
// @route   POST /api/chat/:chatId/message
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    console.log('\n💬 SEND MESSAGE');
    console.log('Chat:', req.params.chatId);
    console.log('Sender:', req.user.id);

    const { chatId } = req.params;
    const { content, type = 'text' } = req.body;

    if (!content) {
      console.log('❌ Message content required\n');
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Verify chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('❌ Chat not found\n');
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(req.user.id)) {
      console.log('❌ User not part of this chat\n');
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    // Create message
    console.log('📝 Creating message...');
    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      content,
      type
    });

    // Update chat's last message info
    chat.lastMessage = content;
    chat.lastMessageTime = new Date();
    chat.lastMessageBy = req.user.id;

    // Increment unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    // 🔍 DEBUG SECTION - START
    console.log('\n🔍 === NOTIFICATION DEBUG ===');
    console.log('🔍 Chat participants:', chat.participants);
    console.log('🔍 Current user ID:', req.user.id);
    console.log('🔍 Current user ID type:', typeof req.user.id);
    
    // 🆕 SEND NOTIFICATION TO RECEIVER
    console.log('🔍 Looking for receiver...');
    const receiverId = chat.participants.find(
      p => p.toString() !== req.user.id
    );

    console.log('🔍 Receiver ID found:', receiverId);
    console.log('🔍 Receiver ID type:', typeof receiverId);

    if (receiverId) {
      console.log('🔍 Fetching sender from database...');
      const sender = await User.findById(req.user.id);
      console.log('🔍 Sender found:', sender ? sender.name : 'NULL');
      
      if (!sender) {
        console.log('⚠️ WARNING: Sender not found in database!');
      } else {
        const messagePreview = content.substring(0, 50) + (content.length > 50 ? '...' : '');
        console.log('🔍 Message preview:', messagePreview);
        
        console.log('🔍 Calling notificationService.notifyNewMessage...');
        console.log('🔍 Parameters:');
        console.log('   - receiverId:', receiverId);
        console.log('   - senderName:', sender.name);
        console.log('   - messagePreview:', messagePreview);
        console.log('   - chatId:', chatId);
        
        try {
          const notifResult = await notificationService.notifyNewMessage(
            receiverId,
            sender.name,
            messagePreview,
            chatId
          );
          console.log('🔍 Notification result:', notifResult ? 'SUCCESS' : 'NULL');
          console.log('📬 Notification sent to receiver');
        } catch (notifError) {
          console.error('❌ Notification error:', notifError);
        }
      }
    } else {
      console.log('⚠️ WARNING: No receiver found! Only one participant in chat?');
    }
    console.log('🔍 === NOTIFICATION DEBUG END ===\n');
    // 🔍 DEBUG SECTION - END

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePhoto');

    console.log('✅ Message sent\n');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('❌ Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    console.log('\n✅ MARK AS READ - Chat:', req.params.chatId);

    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('❌ Chat not found\n');
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(req.user.id)) {
      console.log('❌ User not part of this chat\n');
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    // Reset unread count for this user
    chat.unreadCount.set(req.user.id, 0);
    await chat.save();

    console.log('✅ Messages marked as read\n');

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('❌ Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read',
      error: error.message
    });
  }
};

// ==========================================
// 🆕 NEW: SEND VOICE MESSAGE
// ==========================================

// @desc    Send voice message
// @route   POST /api/chat/:chatId/voice-message
// @access  Private
exports.sendVoiceMessage = async (req, res) => {
  try {
    console.log('\n🎤 SEND VOICE MESSAGE');
    console.log('Chat:', req.params.chatId);
    console.log('Sender:', req.user.id);

    const { chatId } = req.params;
    const { duration } = req.body;

    if (!req.file) {
      console.log('❌ Voice file required\n');
      return res.status(400).json({
        success: false,
        message: 'Voice file is required'
      });
    }

    console.log('📁 Voice file received:', {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: `${(req.file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Verify chat exists and user is participant
    const chat = await Chat.findById(chatId);
    if (!chat) {
      console.log('❌ Chat not found\n');
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    if (!chat.participants.includes(req.user.id)) {
      console.log('❌ User not part of this chat\n');
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    console.log('📤 Uploading voice message to Cloudinary...');

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'smax/voice-messages',
          resource_type: 'video', // Cloudinary treats audio as video
          format: 'mp3' // Convert to MP3
        },
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('✅ Voice uploaded to Cloudinary');
            console.log('URL:', result.secure_url);
            resolve(result);
          }
        }
      );
      uploadStream.end(req.file.buffer);
    });

    // Create voice message
    console.log('📝 Creating voice message in database...');
    const message = await Message.create({
      chat: chatId,
      sender: req.user.id,
      type: 'voice',
      voiceMessage: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        duration: duration || uploadResult.duration || 0,
        fileSize: req.file.size
      }
    });

    console.log('✅ Voice message created:', message._id);

    // Update chat's last message info
    chat.lastMessage = '🎤 Voice message';
    chat.lastMessageTime = new Date();
    chat.lastMessageBy = req.user.id;

    // Increment unread count for other participants
    chat.participants.forEach(participantId => {
      if (participantId.toString() !== req.user.id) {
        const currentCount = chat.unreadCount.get(participantId.toString()) || 0;
        chat.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chat.save();

    console.log('✅ Chat updated with voice message info');

    // Send notification to receiver
    console.log('📬 Sending notification to receiver...');
    const receiverId = chat.participants.find(
      p => p.toString() !== req.user.id
    );

    if (receiverId) {
      const sender = await User.findById(req.user.id);
      if (sender) {
        try {
          await notificationService.notifyNewMessage(
            receiverId,
            sender.name,
            '🎤 Voice message',
            chatId
          );
          console.log('✅ Notification sent to receiver');
        } catch (notifError) {
          console.error('⚠️  Notification error:', notifError.message);
        }
      }
    }

    // Populate sender info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePhoto');

    console.log('✅ Voice message sent successfully\n');

    res.status(201).json({
      success: true,
      message: 'Voice message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('❌ Send voice message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send voice message',
      error: error.message
    });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = exports