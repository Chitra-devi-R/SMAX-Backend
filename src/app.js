// src/app.js - WITH PRODUCTION-READY CORS
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// ==========================================
// LOAD ALL MODELS FIRST
// ==========================================
require('./models/User');
require('./models/Ad');
require('./models/Category');
require('./models/Message');
require('./models/Enquiry');
require('./models/Chat');
require('./models/Notification');
require('./models/Service');

const app = express();

// ==========================================
// CORS CONFIGURATION (PRODUCTION-READY)
// ==========================================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:3000']; // Default for development

console.log('🔒 CORS Allowed Origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl)
    if (!origin) {
      console.log('✅ CORS: Allowed (no origin - mobile/Postman)');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS: Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS: Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and Authorization headers
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS with configuration

// ==========================================
// BODY PARSERS
// ==========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// LOGGING MIDDLEWARE
// ==========================================

// Morgan HTTP logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Enhanced Request Logger
app.use((req, res, next) => {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📨 INCOMING REQUEST');
  console.log('═══════════════════════════════════════════════════════');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Origin:', req.get('origin') || 'No origin');
  
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n');
  next();
});

// ==========================================
// ROOT ROUTES
// ==========================================

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'SMAX Backend API v2.0 - With Video, Voice Call & Service Management Support',
    version: '2.0.0',
    features: {
      authentication: true,
      forgotPassword: true,
      voiceMessages: true,
      videoCalls: true,
      serviceManagement: true,
      notifications: true
    },
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      ads: '/api/ads',
      chat: '/api/chat',
      calls: '/api/calls',
      notifications: '/api/notifications',
      services: '/api/services',
      admin: '/api/admin'
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins
    },
    timestamp: new Date()
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    database: 'connected',
    features: {
      videoUpload: true,
      voiceCall: true,
      voiceMessages: true,
      serviceManagement: true,
      forgotPassword: true
    },
    cors: {
      enabled: true,
      allowedOrigins: allowedOrigins
    },
    timestamp: new Date()
  });
});

// ==========================================
// REGISTER ALL ROUTES
// ==========================================

console.log('📂 Loading routes...');

// 1. Authentication routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered: /api/auth');

// 2. User routes
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);
console.log('✅ User routes registered: /api/users');

// 3. Category routes
const categoryRoutes = require('./routes/categoryRoutes');
app.use('/api/categories', categoryRoutes);
console.log('✅ Category routes registered: /api/categories');

// 4. Ad routes
const adRoutes = require('./routes/adRoutes');
app.use('/api/ads', adRoutes);
console.log('✅ Ad routes registered: /api/ads');

// 5. Chat routes (with voice messages)
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);
console.log('✅ Chat routes registered: /api/chat');

// 6. Call routes
const callRoutes = require('./routes/callRoutes');
app.use('/api/calls', callRoutes);
console.log('✅ Call routes registered: /api/calls');

// 7. Notification routes
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);
console.log('✅ Notification routes registered: /api/notifications');

// 8. Service routes (Vehicle Service Management)
const serviceRoutes = require('./routes/serviceRoutes');
app.use('/api/services', serviceRoutes);
console.log('✅ Service routes registered: /api/services');

// 9. Admin routes
const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);
console.log('✅ Admin routes registered: /api/admin');

console.log('📂 All routes loaded successfully!\n');

// ==========================================
// ERROR HANDLERS
// ==========================================

// 404 handler
app.use((req, res) => {
  console.log('\n❌ 404 - Route not found:', req.method, req.path, '\n');
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
    availableEndpoints: {
      auth: '/api/auth',
      users: '/api/users',
      categories: '/api/categories',
      ads: '/api/ads',
      chat: '/api/chat',
      calls: '/api/calls',
      notifications: '/api/notifications',
      services: '/api/services',
      admin: '/api/admin'
    }
  });
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ Error occurred:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;