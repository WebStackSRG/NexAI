import { Pinecone } from '@pinecone-database/pinecone';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let pineconeClient = null;
let pineconeIndex = null;

/**
 * Returns the Pinecone index instance if configured, or null.
 *
 * @returns {any | null}
 */
export function getPineconeIndex() {
  if (process.env.NODE_ENV === 'test' || !env.PINECONE_API_KEY) {
    return null;
  }

  if (!pineconeClient) {
    try {
      pineconeClient = new Pinecone({ apiKey: env.PINECONE_API_KEY });
      const indexName = env.PINECONE_INDEX || 'nexai';
      pineconeIndex = pineconeClient.index(indexName);
      logger.info({ indexName }, 'Initialized Pinecone vector database client');
    } catch (err) {
      logger.warn({ error: err.message }, 'Failed to initialize Pinecone client');
      return null;
    }
  }

  return pineconeIndex;
}
