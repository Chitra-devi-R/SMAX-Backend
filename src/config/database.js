// src/config/database.js - FIXED for Mongoose 8+
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    console.log('📍 Database URL:', process.env.MONGODB_URI);

    // No need for useNewUrlParser and useUnifiedTopology in Mongoose 8+
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ MongoDB Connected Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 Database Name:', conn.connection.name);
    console.log('🌐 Database Host:', conn.connection.host);
    console.log('📊 Connection State:', conn.connection.readyState);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('❌ MongoDB Connection FAILED!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error Message:', error.message);
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('\n🔧 Troubleshooting:');
    console.error('1. Check if MongoDB is running');
    console.error('2. Windows: net start MongoDB');
    console.error('3. Check .env: MONGODB_URI=mongodb://localhost:27017/smax-app');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    process.exit(1);
  }
};

module.exports = connectDB;
