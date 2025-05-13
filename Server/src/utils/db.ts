import mongoose from 'mongoose';

export const connectToDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '', {
      dbName: 'your-db-name',
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
