import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

/**
 * Returns the appropriate MongoDB connection URI based on the environment.
 * In test mode (NODE_ENV=test), it uses MONGODB_URI_TEST or automatically isolates
 * database access to 'nexai_test', protecting development and production data.
 */
export function getDatabaseUri() {
  if (process.env.NODE_ENV === 'test') {
    if (env.MONGODB_URI_TEST) {
      return env.MONGODB_URI_TEST;
    }
    const uri = env.MONGODB_URI;
    try {
      const isSrv = uri.startsWith('mongodb+srv://');
      const proto = isSrv ? 'mongodb+srv://' : 'mongodb://';
      const parsed = new URL(uri.replace(proto, 'http://'));
      const pathname = parsed.pathname;
      if (pathname && pathname !== '/' && pathname.length > 1) {
        return uri.replace(pathname, '/nexai_test');
      }
      return uri.includes('?') ? uri.replace('?', '/nexai_test?') : `${uri}/nexai_test`;
    } catch {
      return uri.includes('?') ? uri.replace('?', '_test?') : `${uri}_test`;
    }
  }
  return env.MONGODB_URI;
}

export async function connectDB(customUri) {
  if (isConnected) return;

  const targetUri = customUri || getDatabaseUri();
  try {
    const conn = await mongoose.connect(targetUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    logger.info(`MongoDB connected to database: ${conn.connection.name} (${conn.connection.host})`);
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
