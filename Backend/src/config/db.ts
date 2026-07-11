import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connString = process.env.MONGODB_URI || 'mongodb://localhost:27017/campus_gigs_rentals';
    mongoose.set('strictQuery', true);
    
    await mongoose.connect(connString);
    console.log(`MongoDB Connected successfully to ${mongoose.connection.name}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};
