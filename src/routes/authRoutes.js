// src/routes/authRoutes.js - UPDATED
const express = require('express');
const router = express.Router();
const { 
  register, 
  verifyOTP, 
  resendOTP, 
  login, 
  getMe,
  logout,           // 🆕 NEW
  
  updateLanguage ,   // 🆕 NEW
  forgotPassword,      // 🆕 ADD
  verifyResetOTP,      // 🆕 ADD
  resetPassword,        // 🆕 ADD
  changePassword,
  reactivate
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Public routes
router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/reactivate', reactivate); // ✅ ADD THIS

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);                  // 🆕 NEW
router.put('/language', protect, updateLanguage);         // 🆕 NEW
router.post('/change-password', protect,changePassword); // ← ADD THIS LINE


// 🆕 NEW PASSWORD RESET ROUTES
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);


module.exports = router;