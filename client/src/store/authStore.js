import { create } from 'zustand';
import { authApi } from '@/lib/api/auth.api';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: ({ user, accessToken }) =>
    set({
      user,
      accessToken,
      isAuthenticated: !!user,
      isLoading: false,
      error: null,
    }),

  setUser: (user) => set({ user }),

  setAccessToken: (accessToken) => set({ accessToken }),

  clearError: () => set({ error: null }),

  /**
   * Check authentication on app mount using the httpOnly refresh cookie
   */
  checkAuth: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.refreshToken();
      const { user, accessToken } = response.data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return user;
    } catch {
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return null;
    }
  },

  /**
   * Register with email and password
   */
  register: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.register({ email, password });
      const { user, accessToken } = response.data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Registration failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Login with email and password
   */
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.login({ email, password });
      const { user, accessToken } = response.data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Invalid email or password';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Login or signup via Google credential
   */
  googleLogin: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authApi.googleLogin({ credential });
      const { user, accessToken } = response.data;
      set({
        user,
        accessToken,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      return { success: true, user };
    } catch (err) {
      const message = err.message || 'Google authentication failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Logout the user and clear server cookie
   */
  logout: async (silent = false) => {
    if (!silent) {
      try {
        await authApi.logout();
      } catch {
        // Silently continue cleanup
      }
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Update user settings
   */
  updateSettings: async (settings) => {
    try {
      const response = await authApi.updateSettings(settings);
      const updatedUser = response.data.user;
      set({ user: updatedUser });
      return { success: true, user: updatedUser };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to update settings' };
    }
  },
}));
