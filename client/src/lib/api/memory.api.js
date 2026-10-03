import { apiClient } from './client.js';

export const memoryApi = {
  /**
   * Fetch all active long-term memories for the user
   */
  getMemories() {
    return apiClient.get('/memories');
  },

  /**
   * Manually record a memory
   * @param {{ fact: string, category?: string, pinned?: boolean }} data
   */
  createMemory(data) {
    return apiClient.post('/memories', data);
  },

  /**
   * Update an existing memory
   * @param {string} id
   * @param {{ fact?: string, category?: string, pinned?: boolean, active?: boolean }} data
   */
  updateMemory(id, data) {
    return apiClient.patch(`/memories/${id}`, data);
  },

  /**
   * Delete a single memory
   * @param {string} id
   */
  deleteMemory(id) {
    return apiClient.delete(`/memories/${id}`);
  },

  /**
   * Clear all memories for the user
   */
  clearAllMemories() {
    return apiClient.delete('/memories');
  },
};
