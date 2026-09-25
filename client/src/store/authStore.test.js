import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './authStore';
import { authApi } from '@/lib/api/auth.api';

vi.mock('@/lib/api/auth.api', () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    googleLogin: vi.fn(),
    refreshToken: vi.fn(),
    logout: vi.fn(),
    getMe: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

describe('authStore Zustand Store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('updates state on successful login', async () => {
    const mockUser = { _id: '123', email: 'test@nexai.local', role: 'user' };
    const mockToken = 'mock_access_token_123';

    authApi.login.mockResolvedValueOnce({
      data: { user: mockUser, accessToken: mockToken },
    });

    const res = await useAuthStore.getState().login({ email: 'test@nexai.local', password: 'password123' });

    expect(res.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual(mockUser);
    expect(useAuthStore.getState().accessToken).toBe(mockToken);
  });

  it('handles login failure properly', async () => {
    authApi.login.mockRejectedValueOnce(new Error('Invalid email or password'));

    const res = await useAuthStore.getState().login({ email: 'wrong@nexai.local', password: 'wrong' });

    expect(res.success).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().error).toBe('Invalid email or password');
  });

  it('clears state on logout', async () => {
    useAuthStore.setState({
      user: { email: 'user@nexai.local' },
      accessToken: 'token',
      isAuthenticated: true,
    });

    authApi.logout.mockResolvedValueOnce({ data: { message: 'Logged out' } });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
