const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MONGO_URI is not set in .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(uri, {
      // 新版本 mongoose 大多不需要太多配置，这里保持简洁
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;