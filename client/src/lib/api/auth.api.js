import { apiClient } from './client.js';

export const authApi = {
  /**
   * Register a new user
   * @param {{ email: string, password: string }} data
   */
  register(data) {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Login with email and password
   * @param {{ email: string, password: string }} data
   */
  login(data) {
    return apiClient.post('/auth/login', data);
  },

  /**
   * Sign in with Google OAuth ID token
   * @param {{ credential: string }} data
   */
  googleLogin(data) {
    return apiClient.post('/auth/google', data);
  },

  /**
   * Refresh the access token using the httpOnly cookie
   */
  refreshToken() {
    return apiClient.post('/auth/refresh');
  },

  /**
   * Logout and clear session cookie
   */
  logout() {
    return apiClient.post('/auth/logout');
  },

  /**
   * Fetch current authenticated user
   */
  getMe() {
    return apiClient.get('/auth/me');
  },

  /**
   * Update user settings
   * @param {{ theme?: string, defaultModel?: string, webSearchDefaultOn?: boolean }} settings
   */
  updateSettings(settings) {
    return apiClient.patch('/users/me/settings', settings);
  },
};
