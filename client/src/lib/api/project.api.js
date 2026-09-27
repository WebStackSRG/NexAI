import { apiClient } from './client.js';

export const projectApi = {
  /**
   * Fetch all projects for the authenticated user
   */
  getProjects() {
    return apiClient.get('/projects');
  },

  /**
   * Create a new project workspace
   * @param {{ name: string, description?: string, customInstructions?: string, color?: string }} data
   */
  createProject(data) {
    return apiClient.post('/projects', data);
  },

  /**
   * Retrieve project details along with its chats
   * @param {string} id
   */
  getProject(id) {
    return apiClient.get(`/projects/${id}`);
  },

  /**
   * Update an existing project
   * @param {string} id
   * @param {{ name?: string, description?: string, customInstructions?: string, color?: string }} data
   */
  updateProject(id, data) {
    return apiClient.patch(`/projects/${id}`, data);
  },

  /**
   * Delete a project and unlink its chats
   * @param {string} id
   */
  deleteProject(id) {
    return apiClient.delete(`/projects/${id}`);
  },

  /**
   * Add a source (local file or note) to a project
   * @param {string} id
   * @param {{ name: string, originalName?: string, mimeType?: string, size?: number, content?: string }} data
   */
  addSource(id, data) {
    return apiClient.post(`/projects/${id}/sources`, data);
  },

  /**
   * Remove a source from a project
   * @param {string} id
   * @param {string} sourceId
   */
  deleteSource(id, sourceId) {
    return apiClient.delete(`/projects/${id}/sources/${sourceId}`);
  },
};
