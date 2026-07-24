const mongoose = require("mongoose");

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is missing.");
  }

  try {
    await mongoose.connect(uri, {
      bufferCommands: false,        // don't queue queries — fail fast
      serverSelectionTimeoutMS: 8000, // give up finding a server after 8s
      connectTimeoutMS: 8000,
    });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err; // re-throw so callers know the connection failed
  }
}

module.exports = connectDB;
