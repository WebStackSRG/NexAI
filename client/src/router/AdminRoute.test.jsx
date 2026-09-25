import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from './AdminRoute';
import { useAuthStore } from '@/store/authStore';

describe('AdminRoute Guard', () => {
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
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Secret Content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Content')).not.toBeInTheDocument();
  });

  it('renders 403 Forbidden state when user is non-admin', () => {
    useAuthStore.setState({
      user: { email: 'student@nexai.local', role: 'user' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Secret Content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-forbidden-403')).toBeInTheDocument();
    expect(screen.getByText('403 - Access Forbidden')).toBeInTheDocument();
    expect(screen.queryByText('Admin Secret Content')).not.toBeInTheDocument();
  });

  it('renders children when user has admin role', () => {
    useAuthStore.setState({
      user: { email: 'admin@nexai.local', role: 'admin' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Secret Content</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Secret Content')).toBeInTheDocument();
    expect(screen.queryByText('403 - Access Forbidden')).not.toBeInTheDocument();
  });
});
