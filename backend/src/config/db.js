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

    const conn = await mongoose.connect(mongoUri);
    console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // If external URI fails, attempt memory server fallback
    try {
      console.log('⚠️ Falling back to MongoMemoryServer...');
      mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      const conn = await mongoose.connect(mongoUri);
      console.log(`🚀 MongoDB Connected (Memory Server Fallback): ${conn.connection.host}`);
    } catch (fallbackError) {
      console.error(`Fatal DB connection error: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
