// src/controllers/callController.js - COMPLETE VERSION
const Chat = require('../models/Chat');
const User = require('../models/User');
const agoraService = require('../config/agora');
const notificationService = require('../utils/notificationService');
const { v4: uuidv4 } = require('uuid');

// @desc    Initiate a call
// @route   POST /api/calls/initiate
// @access  Private
exports.initiateCall = async (req, res) => {
  try {
    const { chatId, callType } = req.body; // callType: 'audio' or 'video'
    const callerId = req.user.id;

    console.log('\n📞 INITIATING CALL');
    console.log('Chat ID:', chatId);
    console.log('Caller:', callerId);
    console.log('Call Type:', callType);

    // Validate
    if (!chatId || !callType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide chatId and callType'
      });
    }

    // Find chat
    const chat = await Chat.findById(chatId).populate('participants', 'name profilePhoto');
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is part of chat
    const isParticipant = chat.participants.some(
      p => p._id.toString() === callerId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    // Get caller and receiver details
    const caller = chat.participants.find(p => p._id.toString() === callerId);
    const receiver = chat.participants.find(p => p._id.toString() !== callerId);

    if (!receiver) {
      console.log('❌ Receiver not found');
      return res.status(400).json({
        success: false,
        message: 'Cannot find receiver in this chat'
      });
    }

    console.log('✅ Caller:', caller.name);
    console.log('✅ Receiver:', receiver.name);

    // Generate unique call ID and channel name
    const callId = uuidv4();
    const channelName = `call_${chatId}_${Date.now()}`;

    // Generate Agora tokens for both caller and receiver
    const callerToken = agoraService.generateRTCToken(
      channelName,
      callerId,
      'publisher'
    );

    const receiverToken = agoraService.generateRTCToken(
      channelName,
      receiver._id.toString(),
      'publisher'
    );

    // Add call to chat history
    chat.callHistory.push({
      callId: callId,
      caller: callerId,
      receiver: receiver._id,
      status: 'initiated',
      startTime: new Date(),
      callType: callType || 'audio'
    });

    await chat.save();

    console.log('✅ Call initiated');
    console.log('Call ID:', callId);
    console.log('Channel:', channelName);

    // Send notification to receiver
    try {
      await notificationService.notifyIncomingCall(
        receiver._id,
        caller.name,
        chatId
      );
      console.log('📬 Call notification sent to receiver');
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    // Return call details
    res.json({
      success: true,
      message: 'Call initiated successfully',
      data: {
        callId: callId,
        channelName: channelName,
        callType: callType,
        caller: {
          id: caller._id,
          name: caller.name,
          profilePhoto: caller.profilePhoto,
          token: callerToken
        },
        receiver: {
          id: receiver._id,
          name: receiver.name,
          profilePhoto: receiver.profilePhoto,
          token: receiverToken
        },
        chatId: chatId
      }
    });

  } catch (error) {
    console.error('❌ Initiate call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate call',
      error: error.message
    });
  }
};

// @desc    Accept call
// @route   POST /api/calls/:callId/accept
// @access  Private
exports.acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    console.log('\n📞 ACCEPT CALL');
    console.log('Call ID:', callId);
    console.log('User:', userId);

    // Find chat with this call
    const chat = await Chat.findOne({ 'callHistory.callId': callId });

    if (!chat) {
      console.log('❌ Call not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Find the call
    const call = chat.callHistory.find(c => c.callId === callId);

    if (!call) {
      console.log('❌ Call record not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }

    // Check if user is the receiver
    if (call.receiver.toString() !== userId) {
      console.log('❌ User is not the receiver\n');
      return res.status(403).json({
        success: false,
        message: 'Only the receiver can accept this call'
      });
    }

    // Check if call is still in initiated state
    if (call.status !== 'initiated') {
      console.log('❌ Call is not in initiated state\n');
      return res.status(400).json({
        success: false,
        message: `Call is already ${call.status}`
      });
    }

    // Update call status
    call.status = 'answered';
    call.answeredAt = new Date();
    await chat.save();

    console.log('✅ Call accepted');
    console.log('Status:', call.status);
    console.log('');

    res.json({
      success: true,
      message: 'Call accepted',
      data: {
        callId: call.callId,
        status: call.status,
        caller: call.caller,
        receiver: call.receiver,
        callType: call.callType,
        answeredAt: call.answeredAt
      }
    });

  } catch (error) {
    console.error('❌ Accept call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept call',
      error: error.message
    });
  }
};

// @desc    Reject call
// @route   POST /api/calls/:callId/reject
// @access  Private
exports.rejectCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;

    console.log('\n📞 REJECT CALL');
    console.log('Call ID:', callId);
    console.log('User:', userId);

    // Find chat with this call
    const chat = await Chat.findOne({ 'callHistory.callId': callId });

    if (!chat) {
      console.log('❌ Call not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Find the call
    const call = chat.callHistory.find(c => c.callId === callId);

    if (!call) {
      console.log('❌ Call record not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }

    // Check if user is the receiver
    if (call.receiver.toString() !== userId) {
      console.log('❌ User is not the receiver\n');
      return res.status(403).json({
        success: false,
        message: 'Only the receiver can reject this call'
      });
    }

    // Check if call is still in initiated state
    if (call.status !== 'initiated') {
      console.log('❌ Call is not in initiated state\n');
      return res.status(400).json({
        success: false,
        message: `Call is already ${call.status}`
      });
    }

    // Update call status
    call.status = 'rejected';
    call.endTime = new Date();
    call.duration = 0;
    await chat.save();

    console.log('✅ Call rejected');
    console.log('Status:', call.status);
    console.log('');

    // Notify caller that call was rejected
    try {
      const receiver = await User.findById(userId);
      await notificationService.notifyCallRejected(
        call.caller,
        receiver.name,
        callId
      );
      console.log('📬 Rejection notification sent to caller');
    } catch (notifError) {
      console.error('⚠️ Notification error:', notifError.message);
    }

    res.json({
      success: true,
      message: 'Call rejected',
      data: {
        callId: call.callId,
        status: call.status,
        caller: call.caller,
        receiver: call.receiver,
        callType: call.callType
      }
    });

  } catch (error) {
    console.error('❌ Reject call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject call',
      error: error.message
    });
  }
};

// @desc    End call
// @route   POST /api/calls/:callId/end
// @access  Private
exports.endCall = async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = req.user.id;
    const { duration } = req.body;

    console.log('\n📞 END CALL');
    console.log('Call ID:', callId);
    console.log('User:', userId);
    console.log('Duration:', duration);

    // Find chat with this call
    const chat = await Chat.findOne({ 'callHistory.callId': callId });

    if (!chat) {
      console.log('❌ Call not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Find the call
    const call = chat.callHistory.find(c => c.callId === callId);

    if (!call) {
      console.log('❌ Call record not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }

    // Check if user is part of this call
    const isParticipant = 
      call.caller.toString() === userId || 
      call.receiver.toString() === userId;

    if (!isParticipant) {
      console.log('❌ User not part of this call\n');
      return res.status(403).json({
        success: false,
        message: 'You are not part of this call'
      });
    }

    // Check if call is already ended
    if (call.status === 'ended') {
      console.log('⚠️ Call already ended\n');
      return res.status(400).json({
        success: false,
        message: 'Call is already ended'
      });
    }

    // Update call status
    call.status = 'ended';
    call.endTime = new Date();

    // Calculate or set duration
    if (duration) {
      call.duration = duration;
    } else if (call.answeredAt) {
      const start = new Date(call.answeredAt);
      const end = new Date(call.endTime);
      call.duration = Math.floor((end - start) / 1000); // seconds
    } else {
      call.duration = 0; // Call was never answered
    }

    await chat.save();

    console.log('✅ Call ended');
    console.log('Status:', call.status);
    console.log('Duration:', call.duration, 'seconds');
    console.log('');

    res.json({
      success: true,
      message: 'Call ended',
      data: {
        callId: call.callId,
        status: call.status,
        caller: call.caller,
        receiver: call.receiver,
        callType: call.callType,
        duration: call.duration,
        startTime: call.startTime,
        answeredAt: call.answeredAt,
        endTime: call.endTime
      }
    });

  } catch (error) {
    console.error('❌ End call error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end call',
      error: error.message
    });
  }
};

// @desc    Update call status (generic)
// @route   PUT /api/calls/:callId/status
// @access  Private
exports.updateCallStatus = async (req, res) => {
  try {
    const { callId } = req.params;
    const { status, duration } = req.body; // status: 'answered', 'missed', 'rejected', 'ended'

    console.log('\n📞 UPDATE CALL STATUS');
    console.log('Call ID:', callId);
    console.log('New Status:', status);
    console.log('Duration:', duration);

    // Validate status
    const validStatuses = ['initiated', 'answered', 'rejected', 'missed', 'ended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Find chat with this call
    const chat = await Chat.findOne({ 'callHistory.callId': callId });

    if (!chat) {
      console.log('❌ Call not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    // Find and update the call
    const call = chat.callHistory.find(c => c.callId === callId);

    if (!call) {
      console.log('❌ Call record not found\n');
      return res.status(404).json({
        success: false,
        message: 'Call record not found'
      });
    }

    // Update status
    call.status = status;
    
    if (status === 'answered' && !call.answeredAt) {
      call.answeredAt = new Date();
    }
    
    if (status === 'ended' || status === 'rejected' || status === 'missed') {
      call.endTime = new Date();
      
      if (duration) {
        call.duration = duration;
      } else if (call.answeredAt) {
        // Calculate duration
        const start = new Date(call.answeredAt);
        const end = new Date(call.endTime);
        call.duration = Math.floor((end - start) / 1000); // in seconds
      } else {
        call.duration = 0;
      }
    }

    await chat.save();

    console.log('✅ Call status updated');
    console.log('New status:', call.status);
    console.log('');

    res.json({
      success: true,
      message: 'Call status updated',
      data: call
    });

  } catch (error) {
    console.error('❌ Update call status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update call status',
      error: error.message
    });
  }
};

// @desc    Get call history for a chat
// @route   GET /api/calls/history/:chatId
// @access  Private
exports.getCallHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    console.log('\n📞 GET CALL HISTORY');
    console.log('Chat ID:', chatId);
    console.log('User:', userId);

    const chat = await Chat.findById(chatId)
      .populate('callHistory.caller', 'name profilePhoto')
      .populate('callHistory.receiver', 'name profilePhoto');

    if (!chat) {
      console.log('❌ Chat not found\n');
      return res.status(404).json({
        success: false,
        message: 'Chat not found'
      });
    }

    // Check if user is part of chat
    const isParticipant = chat.participants.some(
      p => p.toString() === userId
    );

    if (!isParticipant) {
      console.log('❌ User not part of chat\n');
      return res.status(403).json({
        success: false,
        message: 'You are not part of this chat'
      });
    }

    console.log(`✅ Found ${chat.callHistory.length} calls`);
    console.log('');

    res.json({
      success: true,
      count: chat.callHistory.length,
      data: chat.callHistory
    });

  } catch (error) {
    console.error('❌ Get call history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get call history',
      error: error.message
    });
  }
};

// Export all functions
module.exports = {
  initiateCall: exports.initiateCall,
  acceptCall: exports.acceptCall,
  rejectCall: exports.rejectCall,
  endCall: exports.endCall,
  updateCallStatus: exports.updateCallStatus,
  getCallHistory: exports.getCallHistory
};