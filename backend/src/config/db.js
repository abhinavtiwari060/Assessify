const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  let mongoUri = process.env.MONGODB_URI;

  if (mongoUri && mongoUri.trim() !== '') {
    try {
      console.log('📡 Connecting to configured MONGODB_URI...');
      const options = {
        maxPoolSize: 100,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };
      const conn = await mongoose.connect(mongoUri, options);
      console.log(`🚀 MongoDB Connected (External Database): ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`⚠️ External MongoDB connection failed: ${error.message}`);
      if (process.env.NODE_ENV === 'production') {
        console.error('⛔ Production database connection failed. Exiting process cleanly.');
        process.exit(1);
      }
    }
  }

  // Local Development Fallback: MongoMemoryServer
  try {
    console.log('⚡ Local Development Mode: Starting in-memory MongoDB server...');
    mongoServer = await MongoMemoryServer.create();
    const localUri = mongoServer.getUri();
    const conn = await mongoose.connect(localUri, {
      maxPoolSize: 100,
      minPoolSize: 10,
    });
    console.log(`🚀 MongoDB Connected (Local In-Memory Server): ${conn.connection.host}`);
  } catch (fallbackError) {
    console.error(`❌ Fatal local DB connection error: ${fallbackError.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
