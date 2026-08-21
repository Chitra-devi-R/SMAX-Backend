// src/middlewares/upload.js - UPDATED WITH VOICE MESSAGE SUPPORT
const multer = require('multer');
const path = require('path');

// ==========================================
// FILE FILTERS
// ==========================================

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, JPG, PNG, WEBP) are allowed!'), false);
  }
};

// File filter for videos
const videoFilter = (req, file, cb) => {
  const allowedTypes = /mp4|avi|mov|wmv|flv|mkv|webm/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = file.mimetype.startsWith('video/');

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, AVI, MOV, WEBM, etc.) are allowed!'), false);
  }
};

// 🆕 File filter for voice/audio messages
const voiceFilter = (req, file, cb) => {
  const allowedTypes = /mp3|m4a|ogg|webm|wav|aac/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimeTypes = [
    'audio/mpeg',      // .mp3
    'audio/mp4',       // .m4a
    'audio/ogg',       // .ogg
    'audio/webm',      // .webm
    'audio/wav',       // .wav
    'audio/aac',       // .aac
    'audio/x-m4a'      // .m4a alternative
  ];
  const mimetype = allowedMimeTypes.includes(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files (MP3, M4A, OGG, WEBM, WAV, AAC) are allowed!'), false);
  }
};

// Combined filter for both images and videos
const mediaFilter = (req, file, cb) => {
  const isImage = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
  const isVideo = /mp4|avi|mov|wmv|flv|mkv|webm/.test(path.extname(file.originalname).toLowerCase());
  
  if (isImage || isVideo) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed!'), false);
  }
};

// ==========================================
// STORAGE CONFIGURATION
// ==========================================

const storage = multer.memoryStorage();

// ==========================================
// UPLOAD CONFIGURATIONS
// ==========================================

// Image upload (for profile photos, single images)
const uploadImage = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB for images
  },
  fileFilter: imageFilter
});

// Multiple images upload (for ads, galleries)
const uploadImages = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB per image
  },
  fileFilter: imageFilter
});

// Video upload
const uploadVideo = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB for videos
  },
  fileFilter: videoFilter
});

// 🆕 Voice/Audio upload (for voice messages)
const uploadVoice = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB for voice messages
  },
  fileFilter: voiceFilter
});

// Combined media upload (images + video)
const uploadMedia = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  },
  fileFilter: mediaFilter
});

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  // Single image upload
  uploadSingle: uploadImage.single('image'),
  
  // Multiple images upload (max 10)
  uploadMultiple: uploadImages.array('images', 10),
  
  // Single video upload
  uploadVideo: uploadVideo.single('video'),
  
  // 🆕 Single voice message upload
  uploadVoiceMessage: uploadVoice.single('voice'),
  
  // Combined media upload (images + video)
  uploadMedia: uploadMedia.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ]),
  
  // Profile photo upload
  uploadProfilePhoto: uploadImage.single('profilePhoto'),
  
  // Ad media upload (images + video)
  uploadAdMedia: uploadMedia.fields([
    { name: 'images', maxCount: 10 },
    { name: 'video', maxCount: 1 }
  ])
};