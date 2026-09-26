import { apiClient } from './client.js';

export const chatApi = {
  /**
   * Fetch all chats for the authenticated user
   */
  getChats() {
    return apiClient.get('/chats');
  },

  /**
   * Create a new chat session
   * @param {string | { title?: string, projectId?: string }} [options]
   */
  createChat(options) {
    const payload = typeof options === 'string' ? { title: options } : options || {};
    return apiClient.post('/chats', payload);
  },

  /**
   * Update chat title, projectId or pinned state
   * @param {string} id
   * @param {string | { title?: string, projectId?: string, pinned?: boolean }} payload
   */
  updateChat(id, payload) {
    const data = typeof payload === 'string' ? { title: payload } : payload;
    return apiClient.patch(`/chats/${id}`, data);
  },

  /**
   * Delete a chat and its messages
   * @param {string} id
   */
  deleteChat(id) {
    return apiClient.delete(`/chats/${id}`);
  },

  /**
   * Retrieve all messages for a chat
   * @param {string} id
   */
  getMessages(id) {
    return apiClient.get(`/chats/${id}/messages`);
  },
};
