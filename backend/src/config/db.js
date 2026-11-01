const mongoose = require('mongoose');

async function connectDB() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing from environment variables.');
  mongoose.set('strictQuery', true);
  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${mongoose.connection.host}`);
}

module.exports = connectDB;
