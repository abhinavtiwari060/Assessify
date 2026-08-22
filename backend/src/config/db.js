const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    if (!mongoUri || mongoUri.trim() === '') {
      console.log('⚡ MONGODB_URI not provided. Starting MongoMemoryServer for instant local database experience...');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      console.log(`✅ In-Memory MongoDB running at: ${mongoUri}`);
    }

    const options = {
      maxPoolSize: 100,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    const conn = await mongoose.connect(mongoUri, options);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Fatal Error connecting to MongoDB: ${error.message}`);

    // Production safety: Do NOT fall back to MongoMemoryServer if running in production or if MONGODB_URI was provided
    const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.MONGODB_URI);
    if (isProduction) {
      console.error('⛔ Production database connection failed. Exiting process cleanly.');
      process.exit(1);
    }

    // Development local fallback
    try {
      console.log('⚠️ Local development mode: Falling back to MongoMemoryServer...');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri, {
        maxPoolSize: 100,
        minPoolSize: 10,
      });
      console.log(`🚀 MongoDB Connected (Local Memory Server Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Fatal local DB connection error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
