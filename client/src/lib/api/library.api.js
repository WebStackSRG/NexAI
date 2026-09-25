import { apiClient } from './client.js';

export const libraryApi = {
  /**
   * Fetches paginated library items, optionally filtered by tag.
   * @param {{ tag?: string, page?: number, limit?: number }} [params]
   */
  getItems(params = {}) {
    return apiClient.get('/library', { params });
  },

  /**
   * Retrieves a single library item by ID.
   * @param {string} id
   */
  getItemById(id) {
    return apiClient.get(`/library/${id}`);
  },

  /**
   * Semantically searches the library by meaning and text keywords.
   * @param {string} q
   */
  searchItems(q) {
    return apiClient.get('/library/search', { params: { q } });
  },

  /**
   * Generates AI-suggested title, summary, and tags for a link or note without saving.
   * @param {{ type: 'link' | 'note', url?: string, content?: string }} payload
   */
  suggestItem(payload) {
    return apiClient.post('/library/suggest', payload);
  },

  /**
   * Saves a confirmed library item and generates vector embedding.
   * @param {{ type: 'link' | 'note', url?: string, title: string, summary?: string, tags?: string[], content?: string }} payload
   */
  createItem(payload) {
    return apiClient.post('/library', payload);
  },

  /**
   * Updates an existing library item.
   * @param {string} id
   * @param {{ title?: string, summary?: string, tags?: string[], content?: string }} payload
   */
  updateItem(id, payload) {
    return apiClient.patch(`/library/${id}`, payload);
  },

  /**
   * Deletes a library item.
   * @param {string} id
   */
  deleteItem(id) {
    return apiClient.delete(`/library/${id}`);
  },
};
