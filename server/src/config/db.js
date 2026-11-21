import mongoose from 'mongoose';

export async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.log('Error name:', error.name);
    console.log('Error message:', error.message);

    if (error.reason?.servers) {
      for (const [host, server] of error.reason.servers) {
        console.log('Host:', host);
        console.log('Error:', server.error?.message);
      }
    }

    throw error;
  }
}