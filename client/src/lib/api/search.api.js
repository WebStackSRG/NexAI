import { apiClient } from './client.js';

export const searchApi = {
  /**
   * Performs unified hybrid search across Library, Prompts, and Chats.
   *
   * @param {object} params
   * @param {string} params.q - Search query string
   * @param {'all'|'library'|'prompts'|'chats'} [params.type='all'] - Scope filter
   * @param {number} [params.limit=20] - Max matches per category
   * @returns {Promise<{ data: { query: string, type: string, counts: { total: number, library: number, prompts: number, chats: number }, library: Array<object>, prompts: Array<object>, chats: Array<object> } }>}
   */
  unifiedSearch(params) {
    return apiClient.get('/search', { params });
  },
};
