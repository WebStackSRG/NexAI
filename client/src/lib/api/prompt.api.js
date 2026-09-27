import { apiClient } from './client.js';

export const promptApi = {
  /**
   * Fetch all prompts for the authenticated user with optional filter params.
   * @param {{ tag?: string, search?: string, isFavorite?: boolean }} [params]
   */
  getPrompts(params) {
    return apiClient.get('/prompts', { params });
  },

  /**
   * Create a new prompt template.
   * @param {{ title: string, description?: string, template: string, tags?: string[], isFavorite?: boolean }} data
   */
  createPrompt(data) {
    return apiClient.post('/prompts', data);
  },

  /**
   * Retrieve a specific prompt by ID.
   * @param {string} id
   */
  getPrompt(id) {
    return apiClient.get(`/prompts/${id}`);
  },

  /**
   * Update an existing prompt template.
   * @param {string} id
   * @param {{ title?: string, description?: string, template?: string, tags?: string[], isFavorite?: boolean }} data
   */
  updatePrompt(id, data) {
    return apiClient.patch(`/prompts/${id}`, data);
  },

  /**
   * Delete a prompt template.
   * @param {string} id
   */
  deletePrompt(id) {
    return apiClient.delete(`/prompts/${id}`);
  },
};
