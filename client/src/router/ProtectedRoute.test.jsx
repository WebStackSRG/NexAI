import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuthStore } from '@/store/authStore';

describe('ProtectedRoute Guard', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('redirects unauthenticated users to /login', () => {
    render(
      <MemoryRouter initialEntries={['/chat']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div>Protected Chat</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Chat')).not.toBeInTheDocument();
  });

  it('renders children when user is authenticated', () => {
    useAuthStore.setState({
      user: { email: 'user@nexai.local', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/chat']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div>Protected Chat</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Protected Chat')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
