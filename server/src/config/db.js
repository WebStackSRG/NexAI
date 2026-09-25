import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    isConnected = false;
    logger.error(
      { err: error.message },
      'MongoDB connection failed (server running in degraded mode)',
    );
  }
}

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  logger.error({ err: err.message }, 'MongoDB connection error');
});

export async function disconnectDB() {
  if (!isConnected) return;
  try {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed');
  } catch (err) {
    logger.error({ err: err.message }, 'Error closing MongoDB connection');
  }
}

export function isDbConnected() {
  return mongoose.connection.readyState === 1;
}
