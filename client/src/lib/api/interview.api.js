import { apiClient } from './client.js';

export const interviewApi = {
  /**
   * Start a new mock interview session
   * @param {{ role: string, difficulty: 'junior' | 'mid' | 'senior', topic: string, model?: 'flash' | 'pro', isSimulation?: boolean }} data
   */
  startInterview(data) {
    const headers = data?.isSimulation ? { 'x-simulation': 'true' } : {};
    return apiClient.post('/interview/start', data, { headers });
  },

  /**
   * Conclude an interview session, generate scorecard, and auto-archive to library
   * @param {string} id
   * @param {{ model?: 'flash' | 'pro', isSimulation?: boolean }} [data]
   */
  concludeInterview(id, data = {}) {
    const headers = data?.isSimulation ? { 'x-simulation': 'true' } : {};
    return apiClient.post(`/interview/${id}/conclude`, data, { headers });
  },

  /**
   * List all interview sessions for authenticated user
   */
  getInterviews() {
    return apiClient.get('/interview');
  },

  /**
   * Retrieve single interview session by ID
   * @param {string} id
   */
  getInterviewById(id) {
    return apiClient.get(`/interview/${id}`);
  },
};
