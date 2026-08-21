// src/config/constants.js - PRODUCTION COMPLETE VERSION

// ==========================================
// USER ROLES
// ==========================================
const USER_ROLES = {
  ADMIN: 'admin',
  SELLER: 'seller',
  BUYER: 'buyer'
};

// ==========================================
// AD STATUS
// ==========================================
const AD_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  SOLD: 'sold',
  EXPIRED: 'expired'
};

// ==========================================
// VEHICLE TYPES
// ==========================================
const VEHICLE_TYPES = {
  CAR: 'car',
  BIKE: 'bike',
  THREE_WHEELER: 'three_wheeler',
  FOUR_WHEELER: 'four_wheeler',
  BUS: 'bus',
  TRUCK: 'truck',
  HEAVY_VEHICLE: 'heavy_vehicle',
  COMMERCIAL_VEHICLE: 'commercial_vehicle'
};

// ==========================================
// FUEL TYPES
// ==========================================
const FUEL_TYPES = {
  PETROL: 'petrol',
  DIESEL: 'diesel',
  ELECTRIC: 'electric',
  CNG: 'cng',
  HYBRID: 'hybrid',
  LPG: 'lpg'
};

// ==========================================
// 🆕 NOTIFICATION TYPES
// ==========================================
const NOTIFICATION_TYPES = {
  NEW_MESSAGE: 'new_message',
  NEW_CALL: 'new_call',
  AD_APPROVED: 'ad_approved',
  AD_REJECTED: 'ad_rejected',
  ACCOUNT_REACTIVATED: 'account_reactivated',
  AD_EXPIRED: 'ad_expired',
  PRICE_DROP: 'price_drop',
  NEW_ENQUIRY: 'new_enquiry'
};

// ==========================================
// 🆕 MESSAGE TYPES
// ==========================================
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  VOICE: 'voice',
  VIDEO: 'video',
  FILE: 'file',
  LOCATION: 'location'
};

// ==========================================
// 🆕 CALL TYPES
// ==========================================
const CALL_TYPES = {
  VOICE: 'voice',
  VIDEO: 'video'
};

// ==========================================
// 🆕 SERVICE CATEGORIES
// ==========================================
const SERVICE_CATEGORIES = [
  'Repair',
  'Maintenance',
  'Inspection',
  'Modification',
  'Cleaning',
  'Parts Replacement',
  'Emergency Service',
  'Towing',
  'Insurance',
  'Registration'
];

// ==========================================
// 🆕 CONTACT TYPES (for Service Centers)
// ==========================================
const CONTACT_TYPES = {
  PRIMARY: 'primary',
  SECONDARY: 'secondary',
  WHATSAPP: 'whatsapp',
  LANDLINE: 'landline',
  MOBILE: 'mobile',
  OFFICE: 'office',
  EMERGENCY: 'emergency'
};

// ==========================================
// 🆕 LANGUAGES
// ==========================================
const LANGUAGES = {
  ENGLISH: 'en',
  HINDI: 'hi',
  TAMIL: 'ta',
  TELUGU: 'te',
  KANNADA: 'kn',
  MALAYALAM: 'ml',
  MARATHI: 'mr',
  BENGALI: 'bn'
};

// ==========================================
// OTP CONFIGURATION
// ==========================================
const OTP_EXPIRY = 10 * 60 * 1000; // 10 minutes
const OTP_LENGTH = 6;
const OTP_MAX_ATTEMPTS = 3;
const PASSWORD_RESET_TOKEN_EXPIRY = 15 * 60 * 1000; // 15 minutes

// ==========================================
// 🆕 FILE SIZE LIMITS (bytes)
// ==========================================
const FILE_LIMITS = {
  IMAGE: 5 * 1024 * 1024,          // 5 MB
  VIDEO: 100 * 1024 * 1024,        // 100 MB
  VOICE: 50 * 1024 * 1024,         // 50 MB
  DOCUMENT: 10 * 1024 * 1024,      // 10 MB
  PROFILE_PHOTO: 2 * 1024 * 1024   // 2 MB
};

// ==========================================
// 🆕 PAGINATION
// ==========================================
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  ADS_PER_PAGE: 20,
  MESSAGES_PER_PAGE: 50,
  SERVICES_PER_PAGE: 10
};

// ==========================================
// 🆕 RATE LIMITING
// ==========================================
const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000,       // 15 minutes
  MAX_REQUESTS: 100,                // 100 requests per window
  LOGIN_ATTEMPTS: 5,                // 5 login attempts per window
  OTP_REQUESTS: 3,                  // 3 OTP requests per hour
  PASSWORD_RESET_ATTEMPTS: 3        // 3 password reset attempts per hour
};

// ==========================================
// 🆕 AD CONFIGURATION
// ==========================================
const AD_CONFIG = {
  MAX_IMAGES: 10,
  MAX_VIDEOS: 1,
  AD_EXPIRY_DAYS: 30,
  FEATURED_AD_DURATION_DAYS: 7,
  MIN_PRICE: 1000,
  MAX_PRICE: 100000000
};

// ==========================================
// 🆕 SEARCH RADIUS (kilometers)
// ==========================================
const SEARCH_RADIUS = {
  DEFAULT: 50,      // 50 km
  MIN: 1,           // 1 km
  MAX: 500          // 500 km
};

// ==========================================
// 🆕 CALL CONFIGURATION
// ==========================================
const CALL_CONFIG = {
  MAX_DURATION_MINUTES: 60,        // 60 minutes max call duration
  RING_TIMEOUT_SECONDS: 30,        // 30 seconds ring timeout
  RECONNECT_ATTEMPTS: 3            // 3 reconnection attempts
};

// ==========================================
// 🆕 CHAT CONFIGURATION
// ==========================================
const CHAT_CONFIG = {
  MAX_MESSAGE_LENGTH: 1000,        // 1000 characters
  MAX_VOICE_DURATION_SECONDS: 300, // 5 minutes
  TYPING_TIMEOUT_MS: 3000,         // 3 seconds
  MESSAGE_DELETION_WINDOW_MS: 60000 // 1 minute
};

// ==========================================
// 🆕 NOTIFICATION SETTINGS
// ==========================================
const NOTIFICATION_CONFIG = {
  BATCH_SIZE: 100,                 // Send 100 notifications at a time
  RETRY_ATTEMPTS: 3,               // Retry failed notifications 3 times
  RETENTION_DAYS: 30               // Keep notifications for 30 days
};

// ==========================================
// 🆕 ERROR MESSAGES
// ==========================================
const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_DISABLED: 'Your account has been disabled. Contact support.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address',
  INVALID_OTP: 'Invalid or expired OTP',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  TOKEN_EXPIRED: 'Session expired. Please login again.',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  
  // Validation
  REQUIRED_FIELD: 'This field is required',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_MOBILE: 'Please provide a valid mobile number',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
  PASSWORDS_DONT_MATCH: 'Passwords do not match',
  
  // Resources
  USER_NOT_FOUND: 'User not found',
  AD_NOT_FOUND: 'Ad not found',
  CHAT_NOT_FOUND: 'Chat not found',
  SERVICE_NOT_FOUND: 'Service not found',
  CATEGORY_NOT_FOUND: 'Category not found',
  
  // File Upload
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  NO_FILE_UPLOADED: 'No file was uploaded',
  
  // General
  SERVER_ERROR: 'An error occurred. Please try again later.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.'
};

// ==========================================
// 🆕 SUCCESS MESSAGES
// ==========================================
const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully',
  REGISTER_SUCCESS: 'Registration successful',
  OTP_SENT: 'OTP sent successfully',
  PASSWORD_RESET: 'Password reset successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  AD_CREATED: 'Ad created successfully',
  AD_UPDATED: 'Ad updated successfully',
  AD_DELETED: 'Ad deleted successfully',
  MESSAGE_SENT: 'Message sent successfully',
  NOTIFICATION_SENT: 'Notification sent successfully'
};

// ==========================================
// 🆕 REGEX PATTERNS
// ==========================================
const REGEX = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MOBILE: /^[6-9]\d{9}$/,                          // Indian mobile
  PINCODE: /^[1-9][0-9]{5}$/,                       // Indian pincode
  PRICE: /^\d+(\.\d{1,2})?$/,                       // Price with 2 decimals
  URL: /^https?:\/\/.+/,                            // URL validation
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/
};

// ==========================================
// 🆕 TIME CONSTANTS
// ==========================================
const TIME = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000,
  ONE_MONTH: 30 * 24 * 60 * 60 * 1000
};

// ==========================================
// EXPORTS
// ==========================================
module.exports = {
  // Core
  USER_ROLES,
  AD_STATUS,
  VEHICLE_TYPES,
  FUEL_TYPES,
  
  // 🆕 New Constants
  NOTIFICATION_TYPES,
  MESSAGE_TYPES,
  CALL_TYPES,
  SERVICE_CATEGORIES,
  CONTACT_TYPES,
  LANGUAGES,
  
  // Configuration
  OTP_EXPIRY,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  PASSWORD_RESET_TOKEN_EXPIRY,
  
  // 🆕 New Configuration
  FILE_LIMITS,
  PAGINATION,
  RATE_LIMITS,
  AD_CONFIG,
  SEARCH_RADIUS,
  CALL_CONFIG,
  CHAT_CONFIG,
  NOTIFICATION_CONFIG,
  
  // 🆕 Messages & Validation
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  REGEX,
  TIME
};