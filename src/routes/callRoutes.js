// src/routes/callRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  initiateCall,
  acceptCall,
  rejectCall,
  endCall,
  updateCallStatus,
  getCallHistory
} = require('../controllers/callController');

// Initiate call
router.post('/initiate', protect, initiateCall);

// Accept call
router.post('/:callId/accept', protect, acceptCall);

// Reject call
router.post('/:callId/reject', protect, rejectCall);

// End call
router.post('/:callId/end', protect, endCall);

// Generic status update (if needed)
router.put('/:callId/status', protect, updateCallStatus);

// Get call history
router.get('/history/:chatId', protect, getCallHistory);

module.exports = router;