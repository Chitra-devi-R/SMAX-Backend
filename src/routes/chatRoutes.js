const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { uploadVoiceMessage } = require('../middlewares/upload'); // 🆕 ADD THIS
const chatController = require('../controllers/chatController');


// Apply protect to ALL routes
router.use(protect);
// Existing routes
router.get('/', chatController.getAllChats);
// Start new chat
router.post('/start', chatController.startChat);  // ← CHANGED FROM '/' TO '/start'

router.get('/:chatId/messages', chatController.getMessages);
router.post('/:chatId/message', chatController.sendMessage);
// Send voice message
router.post('/:chatId/voice-message', uploadVoiceMessage, chatController.sendVoiceMessage);

router.put('/:chatId/read', chatController.markAsRead);



module.exports = router;