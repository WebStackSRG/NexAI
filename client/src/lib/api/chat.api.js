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
   * @param {string} [title]
   */
  createChat(title) {
    return apiClient.post('/chats', { title });
  },

  /**
   * Update chat title
   * @param {string} id
   * @param {string} title
   */
  updateChat(id, title) {
    return apiClient.patch(`/chats/${id}`, { title });
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
